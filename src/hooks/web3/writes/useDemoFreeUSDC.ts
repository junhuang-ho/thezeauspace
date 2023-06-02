import { ethers } from "ethers";

import { useState, useEffect } from "react";
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
  useAccount,
  type Address,
} from "wagmi";
import { useWaitForAATransaction } from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_STRING } from "~/constants/common";

const useDemoFreeUSDC = () => {
  // TODO: make addressUSDCx input general token like addressToken, and ideally input from top (after funding)
  const { addressApp, addressUSDC, setIsProgressBarDisplayed } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const [mintAmount, setMintAmount] = useState<string>(ZERO_STRING);
  const mintAmountBN = ethers.utils.parseEther(
    mintAmount.length > 0 ? mintAmount : ZERO_STRING
  );

  const isInvalidMintAmount = mintAmountBN.lte(0);
  const isShowErrorMintAmount =
    mintAmount !== ZERO_STRING && mintAmount.length > 0 && isInvalidMintAmount;

  const isEnabledMint = isConnected && !isInvalidMintAmount;
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [isCleanUpToggled, setIsCleanUpToggled] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: addressUSDC,
    abi: [
      "function mint(address account, uint256 amount) public returns (bool)",
    ],
    functionName: "mint",
    args: [addressWallet, mintAmountBN],
    enabled: isEnabledMint,
  });
  const {
    data,
    isLoading,
    writeAsync: mint,
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
  const isProcessingMint = isLoading || isWriting;

  useEffect(() => {
    setIsProgressBarDisplayed(isProcessingMint);
  }, [isProcessingMint, setIsProgressBarDisplayed]);

  return {
    isInvalidMintAmount,
    isEnabledMint,
    isProcessingMint,
    isCleanUpToggled,
    setMintAmount,
    mint,
  };
};

export default useDemoFreeUSDC;
