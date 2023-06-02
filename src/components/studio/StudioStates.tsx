import { ConnectionState, Track } from "livekit-client";

import { useContext, useState, createContext } from "react";
import {
  useConnectionState,
  useLocalParticipant,
  useTrackToggle,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import { useAppStates } from "~/contexts/AppStates";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";

export interface IStudioStatesContext {}

export const StudioStatesContext = createContext<IStudioStatesContext>({});

export const useStudioStates = (): IStudioStatesContext => {
  return useContext(StudioStatesContext);
};

const StudioStatesProvider = ({ children }: { children: JSX.Element }) => {
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;
  const { cameraTrack, localParticipant } = useLocalParticipant();

  const { addressUSDC, setIsLeftBarOpened, setIsLive } = useAppStates();
  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);

  const [isSessionEndInitiated, setIsSessionEndInitiated] =
    useState<boolean>(false);

  const isStartSessionAllowed = cameraTrack === undefined && !isConnected;

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

  const [previewVideoDeviceId, setPreviewVideoDeviceId] = useState<string>("");
  const [previewAudioDeviceId, setPreviewAudioDeviceId] = useState<string>("");

  //   const videoDevices = useMediaDevices({ kind: "videoinput" });
  const {
    devices: videoDevices,
    activeDeviceId: activeVideoDeviceId,
    setActiveMediaDevice: setVideoActiveMediaDevice,
  } = useMediaDeviceSelect({
    kind: "videoinput",
    // room: room, // TODO: remove room param?
  });
  const {
    devices: audioDevices,
    activeDeviceId: activeAudioDeviceId,
    setActiveMediaDevice: setAudioActiveMediaDevice,
  } = useMediaDeviceSelect({
    kind: "audioinput",
  });

  const [videoDeviceEl, setVideoDeviceEl] = useState<null | HTMLElement>(null);
  const [audioDeviceEl, setAudioDeviceEl] = useState<null | HTMLElement>(null);
  const isVideoDeviceMenuOpened = Boolean(videoDeviceEl);
  const isAudioDeviceMenuOpened = Boolean(audioDeviceEl);

  const contextProvider = {
    isConnected,
    isStartSessionAllowed,
    isSessionEndInitiated,
    isEnabledVideo,
    isTogglingVideo,
    isEnabledAudio,
    isTogglingAudio,
    isVideoDeviceMenuOpened,
    isAudioDeviceMenuOpened,
    cameraTrack,
    localParticipant,
    symbolUSDC,
    previewVideoDeviceId,
    previewAudioDeviceId,
    videoDevices,
    activeVideoDeviceId,
    audioDevices,
    activeAudioDeviceId,
    videoDeviceEl,
    audioDeviceEl,
    setVideoDeviceEl,
    setAudioDeviceEl,
    setVideoActiveMediaDevice,
    setPreviewVideoDeviceId,
    setPreviewAudioDeviceId,
    setAudioActiveMediaDevice,
    toggleVideo,
    toggleAudio,
    setIsSessionEndInitiated,
    setIsLeftBarOpened,
    setIsLive,
  };
  return (
    <StudioStatesContext.Provider value={contextProvider}>
      {children}
    </StudioStatesContext.Provider>
  );
};

export default StudioStatesProvider;
