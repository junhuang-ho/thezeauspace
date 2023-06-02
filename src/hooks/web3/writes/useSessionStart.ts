import { ethers } from "ethers";

import { useState } from "react";
import { usePrepareContractWrite, useContractWrite, useAccount } from "wagmi";
import { useWaitForAATransaction } from "@zerodevapp/wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useIsSuperTokenSupported from "../reads/utils/useIsSuperTokenSupported";
import useTagOfFlowRate from "../reads/fees/useTagOfFlowRate";
// import useNewSessionNonce from "../reads/sessions/useNewSessionNonce";
// import useSessionData from "../reads/sessions/useSessionData";
import useHasActiveFlow from "../reads/flows/useHasActiveFlow";
import useIsMyPreviousSessionLive from "../reads/sessions/useIsMyPreviousSessionLive";

import { ZERO_STRING } from "~/constants/common";

import { log } from "next-axiom";

const useSessionStart = ({
  onSessionStart,
}: {
  onSessionStart: () => Promise<void>;
}) => {
  const {
    addressApp,
    addressUSDCx,
    setIsProgressBarDisplayed,
    setIsLeftBarOpened,
    setIsLive,
  } = useAppStates();
  const { isConnected } = useAuthentication();
  const { address: addressWallet } = useAccount();

  const [addressToken, setAddressToken] = useState<string>("");
  const { isSupported } = useIsSuperTokenSupported(addressToken);

  const isInvalidSessionStartSuperToken =
    !ethers.utils.isAddress(addressToken) || !isSupported;
  const isShowErrorSessionStartSuperToken =
    addressToken.length > 0 && isInvalidSessionStartSuperToken;

  const [sessionStartFlowRate, setSessionStartFlowRate] =
    useState<string>(ZERO_STRING);
  const sessionStartFlowRateBN = ethers.utils.parseEther(
    sessionStartFlowRate.length > 0 ? sessionStartFlowRate : ZERO_STRING
  );

  const { tag, isValidTag } = useTagOfFlowRate(sessionStartFlowRateBN, "720p");
  // TODO: test, will it return a tag even if flowrate out-of-bounds?
  // TODO: test, when BPS NOT enabled
  // TODO: test, when BPS NOT set (but enabled)

  const isInvalidSessionStartFlowRate =
    sessionStartFlowRateBN.lte(0) || !isValidTag;
  const isShowErrorSessionStartFlowRate =
    sessionStartFlowRate !== ZERO_STRING &&
    sessionStartFlowRate.length > 0 &&
    isInvalidSessionStartFlowRate;

  //   const { newSessionNonce } = useNewSessionNonce(addressWallet, addressToken);
  //   const { timestampStop } = useSessionData(
  //     addressWallet,
  //     addressToken,
  //     newSessionNonce > 0 ? newSessionNonce - 1 : 0
  //   );
  //   const isPreviousSessionLive = newSessionNonce > 0 && timestampStop === 0;
  const { isPreviousSessionLive } = useIsMyPreviousSessionLive(addressToken);

  const { hasActiveFlow: isActiveFlow } = useHasActiveFlow(addressUSDCx);

  const isEnabledSessionStart =
    isConnected &&
    !isInvalidSessionStartFlowRate &&
    !isInvalidSessionStartSuperToken &&
    !isPreviousSessionLive &&
    !isActiveFlow; /** this is client side restriction only, not contract level restriction */
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const { config } = usePrepareContractWrite({
    address: addressApp,
    abi: [
      "function startSession(address _superToken, uint96 _flowRate, uint256 _tag) external",
    ],
    functionName: "startSession",
    args: [addressToken, sessionStartFlowRateBN, tag],
    enabled: isEnabledSessionStart,
  });
  const {
    data,
    isLoading,
    writeAsync: startSession,
  } = useContractWrite({
    ...config,
    onMutate: () => {
      setIsProgressBarDisplayed(true);
      log.info("session start - start", { address: addressWallet });
    },
    onError: () => {
      setIsProgressBarDisplayed(false);
      setIsLeftBarOpened(true);
      setIsLive(false);
      log.error("session start - error 1", { address: addressWallet });
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
      log.error("session start - error 2", { address: addressWallet });
    },
    onSuccess: async (receipt) => {
      await onSessionStart();
      setIsWriting(false);
      log.info("session start - success", { address: addressWallet });
    },
  });
  //   useWaitForTransaction({
  //     hash: data?.hash,
  //     onSuccess: async (receipt) => {
  //       await onSessionStart();
  //       setIsWriting(false);
  //     },
  //   });
  const isProcessingSessionStart = isLoading || isWriting;

  //   console.log(
  //     isConnected,
  //     !isInvalidSessionStartFlowRate,
  //     !isInvalidSessionStartSuperToken,
  //     !isPreviousSessionLive
  //   );

  return {
    isInvalidSessionStartFlowRate,
    isInvalidSessionStartSuperToken,
    isPreviousSessionLive,
    isShowErrorSessionStartSuperToken,
    isShowErrorSessionStartFlowRate,
    isEnabledSessionStart,
    isProcessingSessionStart,
    addressToken,
    sessionStartFlowRate,
    setAddressToken,
    setSessionStartFlowRate,
    startSession,
  };
};

export default useSessionStart;
