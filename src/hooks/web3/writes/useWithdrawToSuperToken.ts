import { ethers } from "ethers";

import { useState, useEffect } from "react";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { useWaitForAATransaction } from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useIsSuperTokenSupported from "../reads/utils/useIsSuperTokenSupported";
import useUserBalance from "../reads/balances/useUserBalance";

import { ZERO_STRING } from "~/constants/common";

const useWithdrawToSuperToken = () => {
  const { addressApp, setIsProgressBarDisplayed } = useAppStates();
  const { isConnected } = useAuthentication();

  const [addressToken, setAddressToken] = useState<string>("");
  const { isSupported } = useIsSuperTokenSupported(addressToken);

  const isInvalidWithdrawSuperToken =
    !ethers.utils.isAddress(addressToken) || !isSupported;
  const isShowErrorWithdrawSuperToken =
    addressToken.length > 0 && isInvalidWithdrawSuperToken;

  //   const { address: addressWallet } = useAccount();
  //   const { data: superTokenBalance } = useBalance({
  //     address: addressWallet,
  //     token: addressToken as Address,
  //     enabled: isConnected && !isInvalidWithdrawSuperToken,
  //     watch: isConnected && !isIdle,
  //   });
  //   const superTokenBalanceBN = superTokenBalance
  //     ? superTokenBalance.value
  //     : ZERO_BIG_NUMBER;
  const { balance: superTokenBalanceBN } = useUserBalance(addressToken);

  const [withdrawSuperTokenAmount, setWithdrawSuperTokenAmount] =
    useState<string>(ZERO_STRING);
  const withdrawSuperTokenAmountBN = ethers.utils.parseEther(
    withdrawSuperTokenAmount.length > 0 ? withdrawSuperTokenAmount : ZERO_STRING
  );

  const isInvalidWithdrawSuperTokenAmount =
    withdrawSuperTokenAmountBN.lte(0) ||
    withdrawSuperTokenAmountBN.gt(superTokenBalanceBN);
  const isShowErrorWithdrawSuperTokenAmount =
    withdrawSuperTokenAmount !== ZERO_STRING &&
    withdrawSuperTokenAmount.length > 0 &&
    isInvalidWithdrawSuperTokenAmount;

  const isEnabledWithdrawSuperToken =
    isConnected &&
    // !isInvalidWithdrawSuperTokenAmount &&
    !isInvalidWithdrawSuperToken;
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [isCleanUpToggled, setIsCleanUpToggled] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: addressApp,
    abi: [
      "function withdrawSuperToken(address _superToken, uint256 _amount) external",
    ], // TODO: convert to batch txn and add: 1. convert to USDC, 2. send to outward address // however, making it batch immediately makes it sponsored
    functionName: "withdrawSuperToken",
    args: [addressToken, withdrawSuperTokenAmountBN],
    enabled: isEnabledWithdrawSuperToken,
  });
  const {
    data,
    isLoading,
    writeAsync: withdrawSuperToken,
  } = useContractWrite({
    ...config,
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForAATransaction({
    wait: data?.wait,
    onSuccess: (receipt) => {
      setIsCleanUpToggled((prev) => !prev);
      setIsWriting(false);
    },
  });
  //   useWaitForTransaction({
  //     hash: data?.hash,
  //     onSuccess: (receipt) => {
  //       setIsCleanUpToggled((prev) => !prev);
  //       setIsWriting(false);
  //     },
  //   });
  const isProcessingWithdrawSuperToken = isLoading || isWriting;

  useEffect(() => {
    setIsProgressBarDisplayed(isProcessingWithdrawSuperToken);
  }, [isProcessingWithdrawSuperToken, setIsProgressBarDisplayed]);

  return {
    isShowErrorWithdrawSuperToken,
    isShowErrorWithdrawSuperTokenAmount,
    isEnabledWithdrawSuperToken,
    isProcessingWithdrawSuperToken,
    isCleanUpToggled,
    addressToken,
    withdrawSuperTokenAmount,
    setAddressToken,
    setWithdrawSuperTokenAmount,
    withdrawSuperToken,
  };
};

export default useWithdrawToSuperToken;
