import { useState, useEffect } from "react";
import { usePrepareContractWrite, useContractWrite, useAccount } from "wagmi";
import { useWaitForAATransaction } from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useNewFlowNonce from "../reads/flows/useNewFlowNonce";
import useFlowData from "../reads/flows/useFlowData";
import useMinimumLifespan from "../reads/utils/useMinimumLifespan";
import useSessionData from "../reads/sessions/useSessionData";

import { log } from "next-axiom";

const useFlowClose = () => {
  // TODO: make addressUSDCx input general token like addressToken, and ideally input from top (after funding)
  const { addressApp, addressUSDCx, setIsProgressBarDisplayed } =
    useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();
  const { newFlowNonce } = useNewFlowNonce(addressWallet, addressUSDCx);
  const currentNonce = newFlowNonce > 0 ? newFlowNonce - 1 : 0;

  const { minLifespan } = useMinimumLifespan();
  const { receiver, sessionNonce, timestampIncrease, timestampDecrease } =
    useFlowData(addressUSDCx, currentNonce);
  const minimumEndTimestamp = timestampIncrease + minLifespan; // seconds
  const isTooEarly = Math.floor(Date.now() / 1000) < minimumEndTimestamp + 5;

  // get if have active flow or not (timestampDecrease === 0 && timestampStop === 0)
  const { timestampStop } = useSessionData(
    receiver,
    addressUSDCx,
    sessionNonce
  );
  const isActiveFlow =
    newFlowNonce > 0 && timestampDecrease === 0 && timestampStop === 0;

  const isEnabledFlowClose = isConnected && !isTooEarly && isActiveFlow; // TODO: only enable if flow open
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: addressApp,
    abi: ["function closeFlow(address _superToken, uint256 _nonce) external"],
    functionName: "closeFlow",
    args: [addressUSDCx, currentNonce],
    enabled: isEnabledFlowClose,
  });
  const {
    data,
    isLoading,
    writeAsync: closeFlow,
  } = useContractWrite({
    ...config,
    onMutate: () => {
      setIsProgressBarDisplayed(true);
      log.info("flow close - start", { address: addressWallet });
    },
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("flow close - error 1", { address: addressWallet });
    },
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForAATransaction({
    wait: data?.wait,
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("flow close - error 2", { address: addressWallet });
    },
    onSuccess: (receipt) => {
      setIsWriting(false);
      log.info("flow close - success", { address: addressWallet });
    },
  });
  //   useWaitForTransaction({
  //     hash: data?.hash,
  //     onSuccess: (receipt) => {
  //       setIsWriting(false);
  //     },
  //   });
  const isProcessingFlowClose = isLoading || isWriting;

  return {
    isTooEarly,
    isEnabledFlowClose,
    isProcessingFlowClose,
    closeFlow,
  };
};

export default useFlowClose;
