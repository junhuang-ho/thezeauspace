import { type NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Room as LiveKitRoomAlias, ConnectionState } from "livekit-client";
import { LiveKitRoom } from "@livekit/components-react";
import { type SendTransactionResult } from "wagmi/actions";
import { type BigNumber, ethers } from "ethers";

import { useRouter } from "next/router";
import { useState, useEffect, useContext, createContext } from "react";
import { useConnectionState } from "@livekit/components-react";
import { useNetwork, type Address } from "wagmi";
import { useTimeout } from "@mantine/hooks";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useSAFlowOpen from "~/hooks/web3/writes/useSAFlowOpen";
import useFlowClose from "~/hooks/web3/writes/useFlowClose";
import useDemoFreeUSDC from "~/hooks/web3/writes/useDemoFreeUSDC"; // TODO: remove
import useIsViewSessionAllowed from "~/hooks/web3/reads/utils/useIsViewSessionAllowed";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { api } from "~/utils/api";
import { env } from "~/env.mjs";

import Room from "~/components/room/Room";
import { ZERO_BIG_NUMBER } from "~/constants/common";
const FlowDebugInfo = dynamic(
  () => import("~/components/developer/FlowDebugInfo")
);

interface IRoomContext {
  addressBroadcaster: Address | undefined;
  flowRateTotal: BigNumber;
  isSessionNotStarted: boolean;
  isEnabledSAFlowOpen: boolean;
  isProcessingSAFlowOpen: boolean;
  isEnabledFlowClose: boolean;
  isProcessingFlowClose: boolean;
  saOpenFlow: (() => Promise<SendTransactionResult>) | undefined;
  closeFlow: (() => Promise<SendTransactionResult>) | undefined;
}

const RoomContext = createContext<IRoomContext>({
  addressBroadcaster: undefined,
  flowRateTotal: ZERO_BIG_NUMBER,
  isSessionNotStarted: false,
  isEnabledSAFlowOpen: false,
  isProcessingSAFlowOpen: false,
  isEnabledFlowClose: false,
  isProcessingFlowClose: false,
  saOpenFlow: undefined,
  closeFlow: undefined,
});

export const useRoom = (): IRoomContext => {
  return useContext(RoomContext);
};

const RoomWrapper: NextPage = () => {
  const { query } = useRouter();
  const [addressBroadcaster, setAddressBroadcaster] = useState<
    Address | undefined
  >(undefined);
  const { mutateAsync: getAddressByUsername } =
    api.profile.getAddressByUsername.useMutation();
  useEffect(() => {
    const getBroadcasterAddress = async () => {
      const addressUnconfirmed = query.address;
      if (addressUnconfirmed === undefined || Array.isArray(addressUnconfirmed))
        return;
      if (ethers.utils.isAddress(addressUnconfirmed)) {
        setAddressBroadcaster(addressUnconfirmed);
      } else {
        const addressBroadcaster = await getAddressByUsername({
          username: addressUnconfirmed,
        });
        if (addressBroadcaster !== null)
          setAddressBroadcaster(addressBroadcaster);
      }
    };
    void getBroadcasterAddress();
  }, [query, getAddressByUsername]);

  const {
    addressApp,
    setIsLive,
    setIsProgressBarDisplayed,
    setIsLeftBarOpened,
  } = useAppStates();
  const { isConnected: isUserConnected, username } = useAuthentication();
  const { chain: currentChain } = useNetwork();
  const { mutateAsync: fetchTokenViewer } =
    api.viewer.fetchTokenViewer.useMutation();

  const [isConnectionToggled, setIsConnectionToggled] =
    useState<boolean>(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [room] = useState(
    new LiveKitRoomAlias({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: { simulcast: true },
    })
  );

  const connectionState = useConnectionState(room);
  const isConnected = connectionState === ConnectionState.Connected;

  const [isProcessingRoomConnection, setIsProcessingRoomConnection] =
    useState<boolean>(false);
  const { isViewSessionAllowed } = useIsViewSessionAllowed({
    interval: 1_000 * 3, //1000 * 5, // 5 seconds // TODO: rethink this value
    addressBroadcaster: addressBroadcaster,
    isConditionToJoinRoomMet:
      currentChain?.id !== undefined &&
      !isConnected &&
      !isProcessingRoomConnection,
    isConditionToLeaveRoomMet: isConnected && !isProcessingRoomConnection,
    onIsAllowed: async () => {
      setIsProcessingRoomConnection(true);

      setIsProgressBarDisplayed(true);

      let token;
      try {
        token = await fetchTokenViewer({
          chainId: currentChain!.id,
          addressApp: addressApp,
          addressBroadcaster: addressBroadcaster!,
          name: username,
        });

        setToken(token);
        setIsConnectionToggled(true);
        setIsLeftBarOpened(false);

        console.warn("joining session");
      } catch (error) {
        setIsProcessingRoomConnection(false);
        console.error(error);
      }
    },
    onISDisallowed: async () => {
      setIsProcessingRoomConnection(true);
      await room.disconnect();
      setIsConnectionToggled(false);
      setIsProgressBarDisplayed(false);
      setIsLeftBarOpened(true);
      console.warn("leaving session");
    },
  });

  const {
    flowRateTotal,
    // effectiveLifespan,
    isSufficientDeposit,
    isSessionNotStarted,
    isEnabledSAFlowOpen,
    isProcessingSAFlowOpen,
    saOpenFlow,
  } = useSAFlowOpen({
    addressReceiver: addressBroadcaster,
  });

  const { isTooEarly, isEnabledFlowClose, isProcessingFlowClose, closeFlow } =
    useFlowClose();

  const contextProvider = {
    addressBroadcaster,
    flowRateTotal,
    isSessionNotStarted,
    isEnabledSAFlowOpen,
    isProcessingSAFlowOpen,
    isEnabledFlowClose,
    isProcessingFlowClose,
    saOpenFlow,
    closeFlow,
  };

  if (!isUserConnected) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
        <Typography>Please login to continue</Typography>
      </Stack>
    );
  }

  return (
    <RoomContext.Provider value={contextProvider}>
      <Head>
        <title>zeau | Room</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LiveKitRoom
        room={room}
        token={token}
        serverUrl={env.NEXT_PUBLIC_LIVEKIT_SERVER_URL}
        connect={isConnectionToggled}
        onConnected={() => {
          setIsLive(true);
          setIsProgressBarDisplayed(false);
          setIsProcessingRoomConnection(false);
        }}
        onDisconnected={() => {
          setIsLive(false);
          setIsProgressBarDisplayed(false);
          setIsProcessingRoomConnection(false);
        }}
        audio={false}
        video={false}
        screen={false}
        style={{ width: "100%" }}
      >
        <Room />
      </LiveKitRoom>

      {process.env.NODE_ENV === "development" && (
        <FlowDebugInfo isViewSessionAllowed={isViewSessionAllowed} />
      )}

      <DemoFreeUSDC
        isFreeUSDCOpened={
          !isSufficientDeposit && addressBroadcaster !== undefined
        }
      />
    </RoomContext.Provider>
  );
};

export default RoomWrapper;

const DemoFreeUSDC = ({ isFreeUSDCOpened }: { isFreeUSDCOpened: boolean }) => {
  // TODO: remove
  const {
    // isInvalidMintAmount,
    isEnabledMint,
    isProcessingMint,
    setMintAmount,
    mint,
  } = useDemoFreeUSDC();
  useEffect(() => {
    setMintAmount("50");
  }, [setMintAmount]);

  const [isReady, setIsReady] = useState<boolean>(false);
  const { clear } = useTimeout(() => setIsReady(true), 1_000 * 4, {
    autoInvoke: true,
  });

  return (
    <Dialog open={isReady && isFreeUSDCOpened}>
      <DialogTitle>{"Claim your free USDC to get started!"}</DialogTitle>
      <DialogContent>
        <Button
          fullWidth
          variant="contained"
          disabled={!mint || !isEnabledMint || isProcessingMint}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
          }}
          onClick={async () => {
            await mint?.();
            clear();
          }}
        >
          Get 50 USDC
        </Button>
      </DialogContent>
    </Dialog>
  );
};
