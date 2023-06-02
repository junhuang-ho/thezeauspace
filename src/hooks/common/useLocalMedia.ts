import {
  createLocalVideoTrack,
  createLocalAudioTrack,
  VideoPresets,
  type LocalVideoTrack,
  type LocalAudioTrack,
} from "livekit-client";

import {
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMediaDevices } from "@livekit/components-react";

const useLocalMedia = ({
  isPreview,
  setVideoDeviceId,
  setAudioDeviceId,
}: {
  isPreview: boolean;
  setVideoDeviceId: Dispatch<SetStateAction<string | undefined>>;
  setAudioDeviceId: Dispatch<SetStateAction<string | undefined>>;
}) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<
    LocalVideoTrack | undefined
  >(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<
    LocalAudioTrack | undefined
  >(undefined);
  //   const [videoDeviceId, setVideoDeviceId] = useState<string | undefined>(
  //     undefined
  //   );
  //   const [audioDeviceId, setAudioDeviceId] = useState<string | undefined>(
  //     undefined
  //   );

  const videoDevices = useMediaDevices({ kind: "videoinput" });
  const audioDevices = useMediaDevices({ kind: "audioinput" });

  const createVideoTrack = useCallback(
    async (deviceId: string | undefined) => {
      if (deviceId === undefined) return;

      const videoTrack = await createLocalVideoTrack({
        deviceId: deviceId,
        resolution: VideoPresets.h720.resolution, // TODO: make dynamic and set higher bitrate
      });
      setVideoDeviceId(deviceId);
      setLocalVideoTrack(videoTrack);

      return videoTrack;
      //   if (isPublish) {
      //     await room.localParticipant.publishTrack(videoTrack);
      //     console.warn("Publishing Video");
      //   }
    },
    [setVideoDeviceId]
  );
  const createAudioTrack = useCallback(
    async (deviceId: string | undefined) => {
      if (deviceId === undefined) return;

      const audioTrack = await createLocalAudioTrack({
        deviceId: deviceId,
        // autoGainControl: true, // question: does this affects virtual audio cable
        // echoCancellation: true, // question: does this affects virtual audio cable
        // noiseSuppression: true, // question: does this affects virtual audio cable
      });
      setAudioDeviceId(deviceId);
      setLocalAudioTrack(audioTrack);

      return audioTrack;

      //   if (isPublish) await room.localParticipant.publishTrack(audioTrack);
    },
    [setAudioDeviceId]
  );

  useEffect(() => {
    const createStreams = async () => {
      if (isPreview) {
        await createVideoTrack(videoDevices[0]?.deviceId);
        await createAudioTrack(audioDevices[0]?.deviceId);
        console.log("Auto setting device");
      }
    };

    void createStreams();
  }, [
    isPreview,
    videoDevices,
    audioDevices,
    createVideoTrack,
    createAudioTrack,
  ]);

  return {
    localVideoTrack,
    localAudioTrack,
    videoDevices,
    audioDevices,
  };
};

export default useLocalMedia;
