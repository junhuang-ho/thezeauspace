import dynamic from "next/dynamic";
import {
  Track,
  type LocalVideoTrack,
  ConnectionState,
  VideoPresets,
} from "livekit-client";
import { ethers } from "ethers";

import {
  useConnectionState,
  useTrackToggle,
  useEnsureRoom,
  useRemoteParticipants,
} from "@livekit/components-react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import { useAccount } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useStudio } from "~/pages/studio";
import { useAuthentication } from "~/contexts/Authentication";
import useScreenSize from "~/hooks/common/useScreenSize";
import { useHover, useEventListener, useClipboard } from "@mantine/hooks";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";
import useLocalMedia from "~/hooks/common/useLocalMedia";

import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";

import VideocamOutline from "~/components/icons/VideocamOutline";
import VideocamOffOutline from "~/components/icons/VideocamOffOutline";
import MicOutline from "~/components/icons/MicOutline";
import MicOffOutline from "~/components/icons/MicOffOutline";
import ChevronDownOutline from "../icons/ChevronDownOutline";
import CopyOutline from "../icons/CopyOutline";

import MediaLayoutDesktop, {
  HEIGHT_VIDEO_SCREEN,
} from "../layouts/MediaLayoutDesktop";
const ViewerCount = dynamic(() => import("~/components/studio/ViewerCount"));
const LiveIndicator = dynamic(
  () => import("~/components/studio/LiveIndicator")
);

import { getFlowRateInSeconds } from "~/utils/common";

const Studio = () => {
  const {
    isPreview,
    isConnectionToggled,
    isEnabledSessionStart,
    isProcessingSessionStart,
    isEnabledSessionStop,
    isProcessingSessionStop,
    studioFormValues,
    isPublished,
    setIsPublished,
    startSession,
    stopSession,
  } = useStudio();
  const { isAppUsername, username } = useAuthentication();
  const { address: addressWallet } = useAccount();
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;
  //   const { cameraTrack, localParticipant } = useLocalParticipant();

  const { addressUSDC, setIsLeftBarOpened, setIsLive } = useAppStates();
  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);

  const [isSessionEndInitiated, setIsSessionEndInitiated] =
    useState<boolean>(false);

  const isStartSessionAllowed = !isConnected;

  const room = useEnsureRoom();
  const participants = useRemoteParticipants();
  const participantCount = participants.length;

  const link = isAppUsername
    ? `${window.location.origin}/${username}`
    : `${window.location.origin}/${addressWallet!}`;
  const { copy, copied } = useClipboard();

  useEffect(() => {
    const dynamicPublisher = async () => {
      if (!isConnected) return;
      if (participantCount > 0 && !isPublished) {
        try {
          await room.localParticipant.setCameraEnabled(true);
          await room.localParticipant.setMicrophoneEnabled(true);

          setIsPublished(true);
          console.warn("dynamic - publishing");
        } catch (error) {
          console.warn(error);
        }

        // if (localVideoTrack)
        //   await room.localParticipant.publishTrack(localVideoTrack);
        // if (localAudioTrack)
        //   await room.localParticipant.publishTrack(localAudioTrack);
      } else if (participantCount <= 0 && isPublished) {
        try {
          await room.localParticipant.setCameraEnabled(false);
          await room.localParticipant.setMicrophoneEnabled(false);

          setIsPublished(false);
          console.warn("dynamic - unpublishing");
        } catch (error) {
          console.warn(error);
        }
        // if (localVideoTrack)
        //   await room.localParticipant.unpublishTrack(localVideoTrack);
        // if (localAudioTrack)
        //   await room.localParticipant.unpublishTrack(localAudioTrack);
      }
    };
    void dynamicPublisher();
  }, [isConnected, isPublished, room, participantCount, setIsPublished]);

  return (
    <MediaLayoutDesktop>
      <Stack>
        <Box
          sx={{
            height: HEIGHT_VIDEO_SCREEN,
            bgcolor: "#000000",
          }}
        >
          <MediaTile isPreview={isPreview} isConnected={isConnected} />
        </Box>
        <Box sx={{ height: "25%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2 }}
          >
            <Stack alignItems="center" direction="row" spacing={1}>
              <Tooltip
                title={`Flow rate: Earning ${ethers.utils.formatEther(
                  getFlowRateInSeconds(
                    studioFormValues?.rate,
                    studioFormValues?.flowRate
                  )
                )} ${symbolUSDC} per user-second`}
                placement="top"
              >
                <Chip
                  label={`${studioFormValues?.flowRate ?? ""} ${symbolUSDC}/${
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    studioFormValues?.rate?.toLowerCase()
                  }`}
                  size="small"
                />
              </Tooltip>
              <Divider orientation="vertical" sx={{ height: 20 }} />
              <ViewerCount />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                disabled={addressWallet === undefined}
                icon={copied ? undefined : <CopyOutline />}
                label={copied ? "copied!" : link}
                color={copied ? "success" : undefined}
                onClick={() => {
                  copy(link);
                }}
                sx={{ width: 300 }}
              />
              <Button
                variant="contained"
                disabled={
                  isStartSessionAllowed
                    ? !isEnabledSessionStart ||
                      !startSession ||
                      isProcessingSessionStart ||
                      isConnectionToggled
                    : !isEnabledSessionStop ||
                      !stopSession ||
                      isProcessingSessionStop
                }
                onClick={async () => {
                  if (isStartSessionAllowed) {
                    setIsLeftBarOpened(false);
                    setIsLive(true);
                    await startSession?.();
                  } else {
                    if (isSessionEndInitiated) {
                      await stopSession?.();
                      setIsSessionEndInitiated(false);
                    } else {
                      setIsSessionEndInitiated(true);
                    }
                  }
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  width: 150,
                }}
              >
                {isStartSessionAllowed
                  ? "Start Livestream"
                  : isSessionEndInitiated
                  ? "Confirm End"
                  : "End Livestream"}
              </Button>
              {isSessionEndInitiated && (
                <Button
                  variant="contained"
                  color="error"
                  disabled={
                    !isEnabledSessionStop ||
                    !stopSession ||
                    isProcessingSessionStop
                  }
                  onClick={() => {
                    setIsSessionEndInitiated(false);
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
        <Stack sx={{ px: 2 }}>
          <Typography>{studioFormValues?.title}</Typography>
          {/* TODO: allow edit title */}
        </Stack>
      </Stack>
    </MediaLayoutDesktop>
  );
};

export default Studio;

const MediaTile = ({
  isPreview,
  isConnected,
}: {
  isPreview: boolean;
  isConnected: boolean;
}) => {
  const { videoDeviceId, audioDeviceId, setVideoDeviceId, setAudioDeviceId } =
    useStudio();
  const { localVideoTrack, localAudioTrack, videoDevices, audioDevices } =
    useLocalMedia({
      isPreview: isPreview,
      setVideoDeviceId: setVideoDeviceId,
      setAudioDeviceId: setAudioDeviceId,
    });

  //

  const {
    toggle: toggleVideo,
    enabled: isEnabledVideo,
    pending: isTogglingVideo,
  } = useTrackToggle({
    source: Track.Source.Camera,
  });

  const {
    toggle: toggleAudio,
    enabled: isEnabledAudio,
    pending: isTogglingAudio,
  } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  //   useEffect(() => {
  //     const muteLocalMedia = async () => {
  //       if (isPreview) return;
  //       if (isEnabledVideo) {
  //         await localVideoTrack?.unmute();
  //       } else {
  //         await localVideoTrack?.mute();
  //       }
  //     };
  //     void muteLocalMedia();
  //   }, [isPreview, localVideoTrack, isEnabledVideo]);

  const [videoDeviceEl, setVideoDeviceEl] = useState<null | HTMLElement>(null);
  const [audioDeviceEl, setAudioDeviceEl] = useState<null | HTMLElement>(null);
  const isVideoDeviceMenuOpened = Boolean(videoDeviceEl);
  const isAudioDeviceMenuOpened = Boolean(audioDeviceEl);

  const { hovered: isShowControls, ref: refControls } = useHover();
  const [isMobileShowControls, setIsMobileShowControls] =
    useState<boolean>(false);
  const showControls = useCallback(() => {
    setIsMobileShowControls((prev) => !prev);
  }, []);
  const refMobileControls = useEventListener("touchend", showControls);
  const { isMobile } = useScreenSize();

  return (
    <Stack
      ref={isMobile ? refMobileControls : refControls}
      sx={{ position: "relative", height: "100%" }}
    >
      <LocalMedia localVideoTrack={localVideoTrack} />
      {isConnected && (
        <Box
          sx={{
            position: "absolute",
            width: "100%",
            top: 10,
            p: 1,
          }}
        >
          <LiveIndicator />
        </Box>
      )}

      <Fade in={isMobile ? isMobileShowControls : isShowControls}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            position: "absolute",
            width: "100%",
            bottom: 0,
            p: 1,
          }}
        >
          <ButtonGroup>
            <Button
              variant={isEnabledVideo ? "contained" : "outlined"}
              disabled={!isConnected || isTogglingVideo}
              onClick={async () => {
                await toggleVideo();
              }}
              sx={{
                minWidth: 20,
                height: 25,
                ":disabled": {
                  color: "primary.main",
                },
              }}
            >
              {isEnabledVideo ? <VideocamOutline /> : <VideocamOffOutline />}
            </Button>
            <Button
              variant="contained"
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                setVideoDeviceEl(event.currentTarget);
              }}
              sx={{ minWidth: 20, height: 25 }}
            >
              <ChevronDownOutline />
            </Button>
            <Menu
              anchorEl={videoDeviceEl}
              open={isVideoDeviceMenuOpened}
              onClose={() => {
                setVideoDeviceEl(null);
              }}
            >
              {videoDevices.map((v) => (
                <MenuItem
                  key={v.deviceId}
                  selected={v.deviceId === videoDeviceId}
                  onClick={async () => {
                    // if (isConnected)
                    //   await room.switchActiveDevice("videoinput", v.deviceId); // switch for published to remote
                    await localVideoTrack?.restartTrack({
                      deviceId: v.deviceId,
                      resolution: VideoPresets.h720.resolution, // TODO: make dynamic and set higher bitrate
                    }); // switch for local

                    setVideoDeviceId(v.deviceId);

                    setVideoDeviceEl(null);
                  }}
                >
                  {v.label}
                </MenuItem>
              ))}
            </Menu>
          </ButtonGroup>

          <ButtonGroup>
            <Button
              variant={isEnabledAudio ? "contained" : "outlined"}
              disabled={!isConnected || isTogglingAudio}
              onClick={async () => {
                await toggleAudio();
              }}
              sx={{
                minWidth: 20,
                height: 25,
                ":disabled": {
                  color: "primary.main",
                },
              }}
            >
              {isEnabledAudio ? <MicOutline /> : <MicOffOutline />}
            </Button>
            <Button
              variant="contained"
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                setAudioDeviceEl(event.currentTarget);
              }}
              sx={{ minWidth: 20, height: 25 }}
            >
              <ChevronDownOutline />
            </Button>
            <Menu
              anchorEl={audioDeviceEl}
              open={isAudioDeviceMenuOpened}
              onClose={() => {
                setAudioDeviceEl(null);
              }}
            >
              {audioDevices.map((v) => (
                <MenuItem
                  key={v.deviceId}
                  selected={v.deviceId === audioDeviceId}
                  onClick={async () => {
                    // await createAudioTrack(v.deviceId, isConnected);

                    // if (isConnected)
                    //   await room.switchActiveDevice("audioinput", v.deviceId); // switch for published to remote
                    await localAudioTrack?.restartTrack({
                      deviceId: v.deviceId,
                      //   autoGainControl: true, // question: does this affects virtual audio cable
                      //   echoCancellation: true, // question: does this affects virtual audio cable
                      //   noiseSuppression: true, // question: does this affects virtual audio cable
                    }); // switch for local

                    setAudioDeviceId(v.deviceId);

                    setAudioDeviceEl(null);
                  }}
                >
                  {v.label}
                </MenuItem>
              ))}
            </Menu>
          </ButtonGroup>
        </Stack>
      </Fade>
    </Stack>
  );
};

const LocalMedia = ({
  localVideoTrack,
}: {
  localVideoTrack: LocalVideoTrack | undefined;
}) => {
  const videoEl = useRef(null);
  useEffect(() => {
    if (videoEl.current) localVideoTrack?.attach(videoEl.current);

    return () => {
      localVideoTrack?.detach();
    };
  }, [localVideoTrack, videoEl]);

  return (
    <>
      {localVideoTrack !== undefined && (
        <video ref={videoEl} style={{ height: HEIGHT_VIDEO_SCREEN }} />
      )}
    </>
  );
};
