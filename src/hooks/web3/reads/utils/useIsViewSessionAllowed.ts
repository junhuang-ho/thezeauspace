import { readContract } from "wagmi/actions";
import { ethers } from "ethers";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, type Address } from "wagmi";
import { useDebouncedValue } from "@mantine/hooks";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useInterval from "~/hooks/common/useInterval";

const useIsViewSessionAllowed = ({
  interval,
  addressBroadcaster,
  isConditionToJoinRoomMet,
  isConditionToLeaveRoomMet,
  onIsAllowed,
  onISDisallowed,
}: {
  interval: number; // milliseconds
  addressBroadcaster?: Address;
  isConditionToJoinRoomMet: boolean;
  isConditionToLeaveRoomMet: boolean;
  onIsAllowed: () => Promise<void>;
  onISDisallowed: () => Promise<void>;
}) => {
  const { addressApp } = useAppStates();
  const { isConnected: isUserConnected } = useAuthentication();
  const { address: addressWallet } = useAccount();

  const [isViewSessionAllowed_, setIsViewSessionAllowed_] =
    useState<boolean>(false);
  const [isViewSessionAllowed] = useDebouncedValue(
    isViewSessionAllowed_,
    1_000 * 2
  );

  const handleViewSessionStatus = useCallback(async () => {
    if (
      !addressWallet ||
      (addressBroadcaster !== undefined &&
        !ethers.utils.isAddress(addressBroadcaster))
    )
      return;
    let data;
    try {
      data = await readContract({
        address: addressApp,
        abi: [
          "function isViewSessionAllowed(address _viewer, address _broadcaster) external view returns (bool)",
        ],
        functionName: "isViewSessionAllowed",
        args: [addressWallet, addressBroadcaster],
      });

      setIsViewSessionAllowed_(!!data);
    } catch (error) {
      console.warn("checking failed");
    }
  }, [addressApp, addressWallet, addressBroadcaster]);

  useInterval(handleViewSessionStatus, isUserConnected ? interval : null);

  useEffect(() => {
    const changeRoomConnectionState = async () => {
      if (isViewSessionAllowed && isConditionToJoinRoomMet) {
        await onIsAllowed();
      } else if (!isViewSessionAllowed && isConditionToLeaveRoomMet) {
        await onISDisallowed();
      }
    };
    void changeRoomConnectionState();
  }, [
    isViewSessionAllowed,
    isConditionToJoinRoomMet,
    isConditionToLeaveRoomMet,
    onIsAllowed,
    onISDisallowed,
  ]);

  return { isViewSessionAllowed };
};

export default useIsViewSessionAllowed;
