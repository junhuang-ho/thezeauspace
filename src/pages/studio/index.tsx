import { type NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Room } from "livekit-client";
import { LiveKitRoom } from "@livekit/components-react";
import { type SendTransactionResult } from "wagmi/actions";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useSessionStart from "~/hooks/web3/writes/useSessionStart";
import useSessionStop from "~/hooks/web3/writes/useSessionStop";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { type RatesType, PING_INTERVAL_SECONDS } from "~/constants/common";

import { api } from "~/utils/api";
import { env } from "~/env.mjs";

import Setup from "~/components/studio/Setup";
const Studio = dynamic(() => import("~/components/studio/Studio"));
const SessionDebugInfo = dynamic(
  () => import("~/components/developer/SessionDebugInfo")
);

export type StudioFormValues = {
  flowRate: string;
  rate: RatesType;
  title: string;
};

interface IStudioContext {
  isPreview: boolean;
  isConnectionToggled: boolean;
  isEnabledSessionStart: boolean;
  isProcessingSessionStart: boolean;
  isEnabledSessionStop: boolean;
  isProcessingSessionStop: boolean;
  studioFormValues: StudioFormValues | undefined;
  token: string | undefined;
  videoDeviceId: string | undefined;
  audioDeviceId: string | undefined;
  isPublished: boolean;
  setIsPublished: Dispatch<SetStateAction<boolean>>;
  setVideoDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioDeviceId: Dispatch<SetStateAction<string | undefined>>;
  startSession: (() => Promise<SendTransactionResult>) | undefined;
  stopSession: (() => Promise<SendTransactionResult>) | undefined;
  setIsPreview: Dispatch<SetStateAction<boolean>>;
  setSessionStartFlowRate: Dispatch<SetStateAction<string>>;
  setStudioFormValues: Dispatch<SetStateAction<StudioFormValues | undefined>>;
  setToken: Dispatch<SetStateAction<string | undefined>>;
  setIsConnectionToggled: Dispatch<SetStateAction<boolean>>;
}

const StudioContext = createContext<IStudioContext>({
  isPreview: true,
  isConnectionToggled: false,
  isEnabledSessionStart: false,
  isProcessingSessionStart: false,
  isEnabledSessionStop: false,
  isProcessingSessionStop: false,
  studioFormValues: undefined,
  token: undefined,
  startSession: undefined,
  stopSession: undefined,
  videoDeviceId: undefined,
  audioDeviceId: undefined,
  isPublished: false,
  setIsPublished: () => {},
  setVideoDeviceId: () => {},
  setAudioDeviceId: () => {},
  setIsPreview: () => {},
  setSessionStartFlowRate: () => {},
  setStudioFormValues: () => {},
  setToken: () => {},
  setIsConnectionToggled: () => {},
});

export const useStudio = (): IStudioContext => {
  return useContext(StudioContext);
};

const StudioWrapper: NextPage = () => {
  const {
    addressUSDCx,
    setIsLeftBarOpened,
    setIsLive,
    setIsProgressBarDisplayed,
  } = useAppStates();
  const { isConnected: isUserConnected, username } = useAuthentication();
  const [studioFormValues, setStudioFormValues] = useState<
    StudioFormValues | undefined
  >(undefined);
  const [isConnectionToggled, setIsConnectionToggled] =
    useState<boolean>(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [room] = useState(
    new Room({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: { simulcast: true },
    })
  );
  const [isPreview, setIsPreview] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [videoDeviceId, setVideoDeviceId] = useState<string | undefined>(
    undefined
  );
  const [audioDeviceId, setAudioDeviceId] = useState<string | undefined>(
    undefined
  );
  useEffect(() => {
    const switchDevice = async () => {
      if (videoDeviceId !== undefined)
        await room.switchActiveDevice("videoinput", videoDeviceId);
      if (audioDeviceId !== undefined)
        await room.switchActiveDevice("audioinput", audioDeviceId);
    };

    void switchDevice();
  }, [room, videoDeviceId, audioDeviceId]);

  const { mutateAsync: createSession } =
    api.broadcaster.createSession.useMutation();
  const { mutateAsync: deleteSession } =
    api.broadcaster.deleteSession.useMutation();

  const [isPing, setIsPing] = useState<boolean>(false);
  api.broadcaster.pingDB.useQuery(undefined, {
    refetchInterval: 1_000 * PING_INTERVAL_SECONDS, // millisecond
    refetchIntervalInBackground: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: isPing,
  });

  const {
    // isInvalidSessionStartFlowRate,
    // isInvalidSessionStartSuperToken,
    isPreviousSessionLive,
    // isShowErrorSessionStartSuperToken,
    // isShowErrorSessionStartFlowRate,
    isEnabledSessionStart,
    isProcessingSessionStart,
    // sessionStartFlowRate,
    setAddressToken: setAddressTokenStart,
    setSessionStartFlowRate,
    startSession,
  } = useSessionStart({
    onSessionStart: async () => {
      try {
        const data = await createSession({
          name: username,
          // eslint-disable-next-line
          title: studioFormValues?.title!,
        }); // TODO: add title

        setToken(data.token);
        setIsConnectionToggled(true);
        setIsLeftBarOpened(false);

        setIsPing(true);
      } catch (error) {
        setToken(undefined);
        setIsConnectionToggled(false);
        setIsPing(false);
        console.error(error);
      }
    },
  });

  const {
    // isShowErrorSessionStopSuperToken,
    isEnabledSessionStop,
    isProcessingSessionStop,
    setAddressToken: setAddressTokenStop,
    stopSession,
  } = useSessionStop({
    onSessionStop: async () => {
      setIsPing(false);

      try {
        await deleteSession();
        await room.disconnect();
      } catch (error) {
        console.error(error);
      }

      setIsConnectionToggled(false);
      setIsLeftBarOpened(true);
      setStudioFormValues(undefined);
      setSessionStartFlowRate("");
      setIsProgressBarDisplayed(false); // this is required in case session end at pre-setup page
    },
  });

  useEffect(() => {
    setAddressTokenStart(addressUSDCx);
    setAddressTokenStop(addressUSDCx);
  }, [addressUSDCx, setAddressTokenStart, setAddressTokenStop]); // ENHANCE: move this to Setup.tsx when support more than 1 token

  const contextProvider = {
    isPreview,
    isConnectionToggled,
    isEnabledSessionStart,
    isProcessingSessionStart,
    isEnabledSessionStop,
    isProcessingSessionStop,
    studioFormValues,
    token,
    videoDeviceId,
    audioDeviceId,
    isPublished,
    setIsPublished,
    setVideoDeviceId,
    setAudioDeviceId,
    startSession,
    stopSession,
    setIsPreview,
    setSessionStartFlowRate,
    setStudioFormValues,
    setToken,
    setIsConnectionToggled,
  };

  if (!isUserConnected) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Typography>Please login to continue</Typography>
      </Stack>
    );
  }

  if (
    isPreviousSessionLive &&
    !isProcessingSessionStart &&
    !isConnectionToggled
  ) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Typography variant="h6" align="center">
          End previous livestream session before starting a new one
        </Typography>
        <Button
          variant="contained"
          color="error"
          disabled={
            !isEnabledSessionStop || !stopSession || isProcessingSessionStop
          }
          onClick={async () => {
            await stopSession?.();
          }}
          sx={{
            width: "30%",
            maxWidth: 300,
            m: 5,
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          End Lifestream
        </Button>
      </Stack>
    );
  }

  return (
    <StudioContext.Provider value={contextProvider}>
      <Head>
        <title>zeau | Studio</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {studioFormValues !== undefined ? (
        <LiveKitRoom
          room={room}
          token={token}
          serverUrl={env.NEXT_PUBLIC_LIVEKIT_SERVER_URL}
          connect={isConnectionToggled}
          onConnected={() => {
            setIsPublished(true);
            setIsLive(true);
            setIsProgressBarDisplayed(false);
            setIsPreview(false);
          }}
          onDisconnected={() => {
            setIsLive(false);
            setIsProgressBarDisplayed(false);
          }} // TOOD: bug: not run after disconnect (toggled)
          audio={true}
          video={true}
          screen={false}
          style={{ width: "100%" }}
        >
          <Studio />
        </LiveKitRoom>
      ) : (
        <Setup />
      )}

      {process.env.NODE_ENV === "development" && <SessionDebugInfo />}
    </StudioContext.Provider>
  );
};

export default StudioWrapper;
