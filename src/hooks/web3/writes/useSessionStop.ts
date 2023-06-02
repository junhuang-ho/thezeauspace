import { ethers } from "ethers";

import { useState } from "react";
import { usePrepareContractWrite, useContractWrite, useAccount } from "wagmi";
import { useWaitForAATransaction } from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useIsSuperTokenSupported from "../reads/utils/useIsSuperTokenSupported";
import useNewSessionNonce from "../reads/sessions/useNewSessionNonce";
import useSessionData from "../reads/sessions/useSessionData";

import { log } from "next-axiom";

const useSessionStop = ({
  onSessionStop,
}: {
  onSessionStop: () => Promise<void>;
}) => {
  const { addressApp, setIsProgressBarDisplayed } = useAppStates();
  const { isConnected } = useAuthentication();

  const [addressToken, setAddressToken] = useState<string>("");
  const { isSupported } = useIsSuperTokenSupported(addressToken);

  const isInvalidSessionStopSuperToken =
    !ethers.utils.isAddress(addressToken) || !isSupported;
  const isShowErrorSessionStopSuperToken =
    addressToken.length > 0 && isInvalidSessionStopSuperToken;

  const { address: addressWallet } = useAccount();
  const { newSessionNonce } = useNewSessionNonce(addressWallet, addressToken);
  const { timestampStart, timestampStop } = useSessionData(
    addressWallet,
    addressToken,
    newSessionNonce > 0 ? newSessionNonce - 1 : 0
  );
  const isSessionNotStarted = timestampStart === 0;
  const isSessionAlreadyEnded = timestampStop !== 0;

  const isEnabledSessionStop =
    isConnected &&
    !isInvalidSessionStopSuperToken &&
    !isSessionNotStarted &&
    !isSessionAlreadyEnded;
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: addressApp,
    abi: ["function stopSession(address _superTokens) external"],
    functionName: "stopSession",
    args: [addressToken],
    enabled: isEnabledSessionStop,
  });
  const {
    data,
    isLoading,
    writeAsync: stopSession,
  } = useContractWrite({
    ...config,
    onMutate: () => {
      setIsProgressBarDisplayed(true);
      log.info("session stop - start", { address: addressWallet });
    },
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("session stop - error 1", { address: addressWallet });
    },
    onSuccess: () => {
      setIsWriting(true);
    },
  });
  useWaitForAATransaction({
    wait: data?.wait,
    onError: () => {
      setIsProgressBarDisplayed(false);
      log.error("session stop - error 2", { address: addressWallet });
    },
    onSuccess: async (receipt) => {
      await onSessionStop();
      setIsWriting(false);
      log.info("session stop - success", { address: addressWallet });
    },
  });
  //   useWaitForTransaction({
  //     hash: data?.hash,
  //     onSuccess: (receipt) => {
  //       setIsWriting(false);
  //     },
  //   });
  const isProcessingSessionStop = isLoading || isWriting;

  return {
    isShowErrorSessionStopSuperToken,
    isEnabledSessionStop,
    isProcessingSessionStop,
    addressToken,
    setAddressToken,
    stopSession,
  };
};

export default useSessionStop;
