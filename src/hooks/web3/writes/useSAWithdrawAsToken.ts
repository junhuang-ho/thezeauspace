import { ethers } from "ethers";
import { type ContractCall } from "@zerodevapp/wagmi/dist/hooks/usePrepareContractBatchWrite";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  usePrepareContractBatchWrite,
  useContractBatchWrite,
  useWaitForAATransaction,
} from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useUserBalance from "../reads/balances/useUserBalance";
import useUserEffectiveDeposit from "../reads/balances/useUserEffectiveDeposit";
import useIsSuperTokenSupported from "../reads/utils/useIsSuperTokenSupported";
import useHasActiveFlow from "../reads/flows/useHasActiveFlow";
import useIsMyPreviousSessionLive from "../reads/sessions/useIsMyPreviousSessionLive";

import { log } from "next-axiom";

import { ZERO_STRING } from "~/constants/common";

const useSAWithdrawAsToken = ({
  addressTransfer,
  onCallback,
}: {
  addressTransfer: string;
  onCallback: () => void; //Promise<void>;
}) => {
  const isTransfer = ethers.utils.isAddress(addressTransfer);
  const { address: addressWallet } = useAccount();
  const { addressApp, addressUSDC, addressUSDCx, setIsProgressBarDisplayed } =
    useAppStates();
  const { isConnected } = useAuthentication();

  const { hasActiveFlow: isActiveFlow } = useHasActiveFlow(addressUSDCx);
  const { isPreviousSessionLive } = useIsMyPreviousSessionLive(addressUSDCx);

  const [addressToken, setAddressToken] = useState<string>("");
  const { isSupported } = useIsSuperTokenSupported(addressToken);

  const isInvalidWithdrawSuperToken =
    !ethers.utils.isAddress(addressToken) || !isSupported;
  const isShowErrorWithdrawSuperToken =
    addressToken.length > 0 && isInvalidWithdrawSuperToken;

  const { balance: balanceUSDC, refetch: fetchBalanceUSDC } =
    useUserBalance(addressUSDC);
  const { balance: balanceUSDCx, refetch: fetchBalanceUSDCx } =
    useUserBalance(addressUSDCx);
  const { effectiveDeposit, fetchUserEffectiveDeposit } =
    useUserEffectiveDeposit(addressUSDCx);
  const totalFundsSuperToken = balanceUSDCx.add(effectiveDeposit);
  const totalFunds = totalFundsSuperToken.add(balanceUSDC);

  const fetchWithdrawAsTokenMaxBalance = async () => {
    await fetchBalanceUSDC();
    await fetchBalanceUSDCx();
    await fetchUserEffectiveDeposit();
  };

  const [totalWithdrawAmount, setTotalWithdrawAmount] =
    useState<string>(ZERO_STRING);
  const totalWithdrawAmountBN = ethers.utils.parseEther(
    totalWithdrawAmount.length > 0 ? totalWithdrawAmount : ZERO_STRING
  );
  const isInvalidWithdrawTotalAmount =
    totalWithdrawAmountBN.lte(0) || totalWithdrawAmountBN.gt(totalFunds);
  const isShowErrorWithdrawTotalAmount =
    totalWithdrawAmount !== ZERO_STRING &&
    totalWithdrawAmount.length > 0 &&
    isInvalidWithdrawTotalAmount;

  const isSufficientAmountToken = balanceUSDC.gte(totalWithdrawAmountBN);
  const isSufficientAmountSuperToken = balanceUSDCx.gte(
    totalWithdrawAmountBN.sub(balanceUSDC)
  );

  const [params, setParams] = useState<ContractCall[]>([]);
  useEffect(() => {
    if (isInvalidWithdrawSuperToken || isInvalidWithdrawTotalAmount) return;
    if (isTransfer) {
      if (isSufficientAmountToken) {
        setParams([
          {
            address: addressUSDC,
            abi: [
              "function transfer(address _to, uint256 _amount) public returns (bool)",
            ],
            functionName: "transfer",
            args: [addressTransfer, totalWithdrawAmountBN],
          },
        ]);
        // console.warn("A");
      } else if (isSufficientAmountSuperToken) {
        setParams([
          {
            address: addressUSDCx,
            abi: ["function downgrade(uint256 _amount) external"],
            functionName: "downgrade",
            args: [totalWithdrawAmountBN.sub(balanceUSDC)],
          },
          {
            address: addressUSDC,
            abi: [
              "function transfer(address _to, uint256 _amount) public returns (bool)",
            ],
            functionName: "transfer",
            args: [addressTransfer, totalWithdrawAmountBN],
          },
        ]);
        // console.warn("B");
      } else {
        setParams([
          {
            address: addressApp,
            abi: [
              "function withdrawSuperToken(address _superToken, uint256 _amount) external",
            ],
            functionName: "withdrawSuperToken",
            args: [
              addressToken,
              totalWithdrawAmountBN.sub(balanceUSDCx.add(balanceUSDC)),
            ],
          },
          {
            address: addressUSDCx,
            abi: ["function downgrade(uint256 _amount) external"],
            functionName: "downgrade",
            args: [totalWithdrawAmountBN.sub(balanceUSDC)],
          },
          {
            address: addressUSDC,
            abi: [
              "function transfer(address _to, uint256 _amount) public returns (bool)",
            ],
            functionName: "transfer",
            args: [addressTransfer, totalWithdrawAmountBN],
          },
        ]);
        // console.warn("C");
      }
    } else {
      if (isSufficientAmountToken) return;
      if (isSufficientAmountSuperToken) {
        setParams([
          {
            address: addressUSDCx,
            abi: ["function downgrade(uint256 _amount) external"],
            functionName: "downgrade",
            args: [totalWithdrawAmountBN.sub(balanceUSDC)],
          },
        ]);
        // console.warn("D");
      } else {
        setParams([
          {
            address: addressApp,
            abi: [
              "function withdrawSuperToken(address _superToken, uint256 _amount) external",
            ],
            functionName: "withdrawSuperToken",
            args: [
              addressToken,
              totalWithdrawAmountBN.sub(balanceUSDCx.add(balanceUSDC)),
            ],
          },
          {
            address: addressUSDCx,
            abi: ["function downgrade(uint256 _amount) external"],
            functionName: "downgrade",
            args: [totalWithdrawAmountBN.sub(balanceUSDC)],
          },
        ]);
        // console.warn("E");
      }
    }
  }, [
    isTransfer,
    isInvalidWithdrawSuperToken,
    isInvalidWithdrawTotalAmount,
    isSufficientAmountToken,
    isSufficientAmountSuperToken,
    addressApp,
    addressTransfer,
    addressToken,
    addressUSDC,
    addressUSDCx,
    balanceUSDC,
    balanceUSDCx,
    effectiveDeposit,
    totalWithdrawAmountBN,
  ]);

  const isEnabledSAWithdrawAsToken =
    isConnected &&
    !isActiveFlow &&
    !isPreviousSessionLive &&
    !isInvalidWithdrawSuperToken &&
    !isInvalidWithdrawTotalAmount;
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractBatchWrite({
    calls: params,
    enabled: isEnabledSAWithdrawAsToken,
  });
  const {
    data,
    isLoading,
    writeAsync: saWithdrawAsToken,
  } = useContractBatchWrite({
    ...config,
    onMutate: () => {
      setIsProgressBarDisplayed(true);
      log.info("withdraw as token - start", { address: addressWallet });
    },
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("withdraw as token - error 1", { address: addressWallet });
    },
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForAATransaction({
    wait: data?.wait,
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("withdraw as token - error 2", { address: addressWallet });
    },
    onSuccess: (receipt) => {
      onCallback();
      setIsProgressBarDisplayed(false);
      setIsWriting(false);
      log.info("withdraw as token - success", { address: addressWallet });
    },
  });
  const isProcessingSAWithdrawAsToken = isLoading || isWriting;

  return {
    totalFunds,
    totalFundsSuperToken,
    isSufficientAmountToken,
    isSufficientAmountSuperToken,
    isInvalidWithdrawSuperToken,
    isInvalidWithdrawTotalAmount,
    isShowErrorWithdrawSuperToken,
    isShowErrorWithdrawTotalAmount,
    isEnabledSAWithdrawAsToken,
    isProcessingSAWithdrawAsToken,
    addressToken,
    totalWithdrawAmount,
    setAddressToken,
    setTotalWithdrawAmount,
    fetchWithdrawAsTokenMaxBalance,
    saWithdrawAsToken,
  };
};

export default useSAWithdrawAsToken;
// TODO: put rate limit for non-active (openflow/session - with viewers) users
