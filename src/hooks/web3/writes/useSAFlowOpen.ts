import { useEffect, useState } from "react";
import { useAccount, type Address } from "wagmi";
import {
  usePrepareContractBatchWrite,
  useContractBatchWrite,
  useWaitForAATransaction,
} from "@zerodevapp/wagmi";
import { type ContractCall } from "@zerodevapp/wagmi/dist/hooks/usePrepareContractBatchWrite";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useIsSufficientAppGelatoBalance from "../reads/utils/useIsSufficientAppGelatoBalance";
import useIsNewFlowRateAllowed from "../reads/flows/useIsNewFlowRateAllowed";
import useHasActiveFlow from "../reads/flows/useHasActiveFlow";
import useNewSessionNonce from "../reads/sessions/useNewSessionNonce";
import useSessionData from "../reads/sessions/useSessionData";
import useMinimumEndDuration from "../reads/utils/useMinimumEndDuration";
import useMinimumLifespan from "../reads/utils/useMinimumLifespan";
import useUserBalance from "../reads/balances/useUserBalance";
import useUserTotalFunds from "../reads/balances/useUserTotalFunds";
import useIsSuperTokenSupported from "../reads/utils/useIsSuperTokenSupported";
import useIsMyPreviousSessionLive from "../reads/sessions/useIsMyPreviousSessionLive";

import { log } from "next-axiom";

const useSAFlowOpen = ({ addressReceiver }: { addressReceiver?: Address }) => {
  // TODO: make addressUSDCx input general token like addressToken, and ideally input from top (after funding)
  const { address: addressWallet } = useAccount();
  const {
    addressApp,
    addressUSDC,
    addressUSDCx,
    setIsProgressBarDisplayed,
    setIsLeftBarOpened,
    setIsLive,
  } = useAppStates();
  const { isConnected } = useAuthentication();
  const { hasActiveFlow: isActiveFlow } = useHasActiveFlow(addressUSDCx);
  const { isSufficientAppGelatoBalance } = useIsSufficientAppGelatoBalance();
  const { isSupported: isSuperTokenSupported } =
    useIsSuperTokenSupported(addressUSDCx);
  const { newSessionNonce } = useNewSessionNonce(addressReceiver, addressUSDCx);
  const { flowRateEffective, flowRateTotal, timestampStart, timestampStop } =
    useSessionData(
      addressReceiver,
      addressUSDCx,
      newSessionNonce > 0 ? newSessionNonce - 1 : 0
    );
  const isSessionNotStarted =
    newSessionNonce > 0 ? timestampStart !== 0 && timestampStop !== 0 : true;
  const { isSufficientAppSuperTokenBuffer } = useIsNewFlowRateAllowed(
    flowRateEffective,
    addressUSDCx
  );

  const { totalFunds } = useUserTotalFunds();

  const maxUnsafeLifespan = flowRateEffective.lte(0)
    ? 0
    : totalFunds.div(flowRateEffective).toNumber();
  const { minEndDuration } = useMinimumEndDuration();
  const effectiveLifespan =
    maxUnsafeLifespan === 0 ? 0 : maxUnsafeLifespan - minEndDuration; // safeLifespan
  const { minLifespan } = useMinimumLifespan();
  const isSufficientDeposit = effectiveLifespan >= minLifespan;

  const lifespanNumber = effectiveLifespan;

  const { balance: balanceUSDC } = useUserBalance(addressUSDC);
  const { balance: balanceUSDCx } = useUserBalance(addressUSDCx);

  const [params, setParams] = useState<ContractCall[]>([]);
  useEffect(() => {
    if (addressReceiver === undefined) return;
    if (balanceUSDC.lte(0) && balanceUSDCx.lte(0)) {
      setParams([
        {
          address: addressApp,
          abi: [
            "function openFlow(address _receiver, address _superToken, uint256 _lifespan) external",
          ],
          functionName: "openFlow",
          args: [addressReceiver, addressUSDCx, lifespanNumber],
        },
      ]);
    } else if (balanceUSDC.lte(0) && balanceUSDCx.gt(0)) {
      setParams([
        {
          address: addressUSDCx,
          abi: [
            "function approve(address _spender, uint256 _amount) public returns (bool)",
          ],
          functionName: "approve",
          args: [addressApp, balanceUSDCx],
        },
        {
          address: addressApp,
          abi: [
            "function depositSuperToken(address _superToken, uint256 _amount) external",
          ],
          functionName: "depositSuperToken",
          args: [addressUSDCx, balanceUSDCx],
        },
        {
          address: addressApp,
          abi: [
            "function openFlow(address _receiver, address _superToken, uint256 _lifespan) external",
          ],
          functionName: "openFlow",
          args: [addressReceiver, addressUSDCx, lifespanNumber],
        },
      ]);
    } else if (balanceUSDC.gt(0) && balanceUSDCx.lte(0)) {
      setParams([
        {
          address: addressUSDC,
          abi: [
            "function approve(address _spender, uint256 _amount) external returns (bool)",
          ],
          functionName: "approve",
          args: [addressUSDCx, balanceUSDC],
        },
        {
          address: addressUSDCx,
          abi: ["function upgrade(uint256 _amount) external"],
          functionName: "upgrade",
          args: [balanceUSDC],
        },
        {
          address: addressUSDCx,
          abi: [
            "function approve(address _spender, uint256 _amount) public returns (bool)",
          ],
          functionName: "approve",
          args: [addressApp, balanceUSDC],
        },
        {
          address: addressApp,
          abi: [
            "function depositSuperToken(address _superToken, uint256 _amount) external",
          ],
          functionName: "depositSuperToken",
          args: [addressUSDCx, balanceUSDC],
        },
        {
          address: addressApp,
          abi: [
            "function openFlow(address _receiver, address _superToken, uint256 _lifespan) external",
          ],
          functionName: "openFlow",
          args: [addressReceiver, addressUSDCx, lifespanNumber],
        },
      ]);
    } else {
      setParams([
        {
          address: addressUSDC,
          abi: [
            "function approve(address _spender, uint256 _amount) external returns (bool)",
          ],
          functionName: "approve",
          args: [addressUSDCx, balanceUSDC],
        },
        {
          address: addressUSDCx,
          abi: ["function upgrade(uint256 _amount) external"],
          functionName: "upgrade",
          args: [balanceUSDC],
        },
        {
          address: addressUSDCx,
          abi: [
            "function approve(address _spender, uint256 _amount) public returns (bool)",
          ],
          functionName: "approve",
          args: [addressApp, balanceUSDC.add(balanceUSDCx)],
        },
        {
          address: addressApp,
          abi: [
            "function depositSuperToken(address _superToken, uint256 _amount) external",
          ],
          functionName: "depositSuperToken",
          args: [addressUSDCx, balanceUSDC.add(balanceUSDCx)],
        },
        {
          address: addressApp,
          abi: [
            "function openFlow(address _receiver, address _superToken, uint256 _lifespan) external",
          ],
          functionName: "openFlow",
          args: [addressReceiver, addressUSDCx, lifespanNumber],
        },
      ]);
    }
  }, [
    balanceUSDC,
    balanceUSDCx,
    addressApp,
    addressWallet,
    addressUSDC,
    addressUSDCx,
    addressReceiver,
    lifespanNumber,
  ]);

  const { isPreviousSessionLive } = useIsMyPreviousSessionLive(addressUSDCx);

  const isEnabledSAFlowOpen =
    addressWallet !== addressReceiver && // cannot be self! - so that nothing unexpected happens!
    isConnected &&
    !isActiveFlow &&
    isSufficientAppGelatoBalance &&
    isSuperTokenSupported &&
    !isSessionNotStarted &&
    isSufficientAppSuperTokenBuffer &&
    isSufficientDeposit &&
    params.length > 0 &&
    !isPreviousSessionLive; /** this is client side restriction only, not contract level restriction */
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractBatchWrite({
    calls: params,
    enabled: isEnabledSAFlowOpen,
  });
  const {
    data,
    isLoading,
    writeAsync: saOpenFlow,
  } = useContractBatchWrite({
    ...config,
    onMutate: () => {
      setIsProgressBarDisplayed(true);
      log.info("flow open - start", { address: addressWallet });
    },
    onError: () => {
      setIsProgressBarDisplayed(false);
      setIsLeftBarOpened(true);
      setIsLive(false);
      log.error("flow open - error 1", { address: addressWallet });
    },
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForAATransaction({
    wait: data?.wait,
    onError: () => {
      setIsProgressBarDisplayed(false);
      setIsLeftBarOpened(true);
      setIsLive(false);
      log.error("flow open - error 2", { address: addressWallet });
    },
    onSuccess: (receipt) => {
      setIsWriting(false);
      log.info("flow open - success", { address: addressWallet });
    },
  });
  const isProcessingSAFlowOpen = isLoading || isWriting;

  //   console.log(
  //     // isConnected,
  //     // isSufficientDeposit,
  //     // isSufficientAppGelatoBalance,
  //     // !isSessionNotStarted,
  //     // isSufficientAppSuperTokenBuffer,
  //     // !isActiveFlow,
  //     // params.length > 0,
  //     params.length
  //     // saOpenFlow //
  //   );

  //   const isSessionNotStarted = false;
  //   const isEnabledSAFlowOpen = false;
  //   const saOpenFlow = undefined;

  return {
    flowRateTotal,
    effectiveLifespan,
    isSufficientDeposit,
    isSessionNotStarted,
    isEnabledSAFlowOpen,
    isProcessingSAFlowOpen,
    saOpenFlow,
  };
};

export default useSAFlowOpen;
