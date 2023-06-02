import { Track, ConnectionState } from "livekit-client";
import { ethers } from "ethers";

import { api } from "~/utils/api";

import {
  useConnectionState,
  useTracks,
  AudioTrack,
  VideoTrack,
} from "@livekit/components-react";
import { useState, useCallback } from "react";
import { useAppStates } from "~/contexts/AppStates";
import {
  useFullscreen,
  useDebouncedValue,
  useHover,
  useEventListener,
} from "@mantine/hooks";
import { useRoom } from "~/pages/[address]";
import useScreenSize from "~/hooks/common/useScreenSize";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";

import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";

import VolumeOffOutline from "~/components/icons/VolumeOffOutline";
import VolumeLowOutline from "~/components/icons/VolumeLowOutline";
import VolumeMediumOutline from "~/components/icons/VolumeMediumOutline";
import VolumeHighOutline from "~/components/icons/VolumeHighOutline";
import ExpandOutline from "~/components/icons/ExpandOutline";
import ContractOutline from "~/components/icons/ContractOutline";

import MediaLayoutDesktop, {
  HEIGHT_VIDEO_SCREEN,
} from "../layouts/MediaLayoutDesktop";

const Room = () => {
  const {
    addressBroadcaster,
    flowRateTotal,
    isSessionNotStarted,
    isEnabledSAFlowOpen,
    isProcessingSAFlowOpen,
    isEnabledFlowClose,
    isProcessingFlowClose,
    saOpenFlow,
    closeFlow,
  } = useRoom();
  const { addressUSDC, setIsLive, setIsLeftBarOpened } = useAppStates();
  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);

  const { data: session } = api.viewer.getSession.useQuery(
    { addressBroadcaster: addressBroadcaster! },
    {
      refetchInterval: false,
      refetchIntervalInBackground: false,
      enabled: addressBroadcaster !== undefined,
    }
  );

  const {
    ref: refFullscreen,
    toggle: toggleFullscreen,
    fullscreen: isFullscreen,
  } = useFullscreen();

  const [debounced] = useDebouncedValue(isProcessingFlowClose, 1_000 * 10);

  const flowRateHelper = (
    <Stack>
      <Typography variant="caption">Equivalent to:</Typography>
      <Typography variant="caption">
        {ethers.utils.formatEther(flowRateTotal)} {symbolUSDC}/second
      </Typography>
      <Typography variant="caption">
        {ethers.utils.formatEther(flowRateTotal.mul(60).mul(60))} {symbolUSDC}
        /hour
      </Typography>
    </Stack>
  );

  return (
    <MediaLayoutDesktop>
      <Stack>
        <Box
          ref={refFullscreen}
          sx={{
            height: isFullscreen ? undefined : HEIGHT_VIDEO_SCREEN,
            bgcolor: "#000000",
          }}
        >
          <MediaTile
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
          {isSessionNotStarted && (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ height: "100%" }}
            >
              <Typography align="center" sx={{ fontWeight: "bold" }}>
                User Not Live
              </Typography>
            </Stack>
          )}
        </Box>
        <Box sx={{ height: "25%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2 }}
          >
            {!isSessionNotStarted ? (
              <Stack alignItems="flex-start">
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Typography>{session?.name}</Typography>
                  <Divider orientation="vertical" sx={{ height: 20 }} />
                  <Tooltip title={flowRateHelper} placement="top">
                    <Chip
                      label={`Flow rate: ${ethers.utils.formatEther(
                        flowRateTotal.mul(60)
                      )} ${symbolUSDC}/minute`}
                      size="small"
                    />
                  </Tooltip>
                </Stack>

                <Typography variant="caption">{session?.title}</Typography>
              </Stack>
            ) : (
              <Box sx={{ p: 1 }}></Box>
            )}

            <Button
              variant="contained"
              disabled={
                (isEnabledFlowClose
                  ? !closeFlow || !isEnabledFlowClose
                  : !saOpenFlow || !isEnabledSAFlowOpen) ||
                isProcessingFlowClose ||
                isProcessingSAFlowOpen ||
                debounced
              }
              onClick={async () => {
                if (isEnabledFlowClose) {
                  await closeFlow?.();
                } else {
                  setIsLeftBarOpened(false);
                  setIsLive(true);
                  await saOpenFlow?.();
                }
              }}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              {isEnabledFlowClose ? "Close Flow" : "Open Flow"}
            </Button>
          </Stack>
        </Box>
        {isEnabledFlowClose && (
          <Stack direction="row" justifyContent="flex-end" sx={{ px: 2 }}>
            <Chip
              variant="outlined"
              label="Do not leave page without closing flow"
              color="warning"
            />
          </Stack>
        )}
      </Stack>
    </MediaLayoutDesktop>
  );
};

export default Room;

const MediaTile = ({
  isFullscreen,
  toggleFullscreen,
}: {
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    {
      onlySubscribed: true,
    }
  );
  const trackVideo = tracks[0];
  const trackAudio = tracks[1];

  const { hovered: isShowControls, ref: refControls } = useHover();
  const [isMobileShowControls, setIsMobileShowControls] =
    useState<boolean>(false);
  const showControls = useCallback(() => {
    setIsMobileShowControls((prev) => !prev);
  }, []);
  const refMobileControls = useEventListener("touchend", showControls);
  const { isMobile } = useScreenSize();
  const [volume, setVolume] = useState<number>(0);

  //   const {
  //     // className,
  //     // roomAudioPlaybackAllowedObservable,
  //     handleStartAudioPlayback,
  //   } = useMemo(() => setupStartAudio(), []);
  //   const room = useEnsureRoom();
  //   const observable = useMemo(
  //     () => roomAudioPlaybackAllowedObservable(room),
  //     [room, roomAudioPlaybackAllowedObservable]
  //   );

  return (
    <Stack
      ref={isMobile ? refMobileControls : refControls}
      sx={{ position: "relative" }}
    >
      {trackVideo !== undefined && (
        <VideoTrack
          source={trackVideo.source}
          participant={trackVideo.participant}
          style={{
            height: isFullscreen ? undefined : HEIGHT_VIDEO_SCREEN,
          }}
        />
      )}
      {trackAudio !== undefined && (
        <AudioTrack
          source={trackAudio.source}
          participant={trackAudio.participant}
          volume={volume}
        />
      )}
      {trackVideo !== undefined && (
        <Fade in={isMobile ? isMobileShowControls : isShowControls}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{
              position: "absolute",
              width: "100%",
              bottom: 0,
              p: 1,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ width: 150, color: "primary.main" }}
            >
              {volume === 0 && <VolumeOffOutline />}
              {volume > 0 && volume < 0.3 && <VolumeLowOutline />}
              {volume >= 0.3 && volume < 0.7 && <VolumeMediumOutline />}
              {volume >= 0.7 && volume <= 1 && <VolumeHighOutline />}

              <Slider
                size="small"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event: Event, newValue: number | number[]) => {
                  if (typeof newValue !== "number") return;
                  setVolume(newValue);

                  // await handleStartAudioPlayback(room); // ref: https://github.com/livekit/components-js/blob/main/packages/react/src/components/controls/StartAudio.tsx
                  // ENHANCE: wait for livekit release `useStartAudio` then use that hook
                }}
              />
            </Stack>
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: "primary.main" }}
            >
              {isFullscreen ? <ContractOutline /> : <ExpandOutline />}
            </IconButton>
          </Stack>
        </Fade>
      )}
    </Stack>
  );
};
