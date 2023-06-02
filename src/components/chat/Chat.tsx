import {
  RoomEvent,
  ConnectionState,
  type RemoteParticipant,
} from "livekit-client";

import { useRouter } from "next/router";
import {
  useChat,
  useConnectionState,
  useEnsureRoom,
} from "@livekit/components-react";
import { useState, useEffect, useRef, useCallback } from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import SendOutline from "~/components/icons/SendOutline";

import { selectColor, stringNumber } from "~/utils/common";

import { type ReceivedChatMessage } from "@livekit/components-react";

import { ROUTE_STUDIO } from "~/constants/common";

const HEIGHT_CHAT_INPUT = 60;

interface ReceivedChatMessagePlus extends ReceivedChatMessage {
  peerName?: string;
  isJoined?: boolean;
}

const Chat = () => {
  const { pathname } = useRouter();
  const isStudio = pathname === ROUTE_STUDIO;
  const connectionState = useConnectionState();
  const isConnected = connectionState === ConnectionState.Connected;

  const room = useEnsureRoom();
  //   const participants = useRemoteParticipants();
  //   const participantCount = participants.length
  const { send, chatMessages: chatMessages_, isSending } = useChat();
  const chatMessages = chatMessages_ as ReceivedChatMessagePlus[];
  const [message, setMessage] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const refMessages = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const refMessageInput = useRef<any>(null);
  //   const [peerCount, {increment, decrement, reset}] = useCounter(0)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    refMessages?.current?.scrollIntoView({ behaviour: "smooth" });
  }, [refMessages, chatMessages]); // ref: https://stackoverflow.com/a/70863895

  const handleSendMessage = async () => {
    if (message.length <= 0) return;
    try {
      await send?.(message);
      setMessage("");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      refMessageInput?.current?.focus();
    } catch (error) {
      console.error(error);
    }
  };

  const lParticipantConnected = useCallback(
    (remoteParticipant: RemoteParticipant) => {
      if (remoteParticipant.permissions?.hidden) return;

      const name = remoteParticipant?.name;
      chatMessages.push({
        timestamp: 0,
        message: "",
        peerName: name,
        isJoined: true,
      });

      //   setChatMessages((oldArray: MESSAGE[]) => [
      //     ...oldArray,
      //     {
      //       senderName:
      //         name?.slice(0, 2) === "0x" ? shortenAddress(name as ADDRESS) : name,
      //       peerStatus: "joined",
      //     },
      //   ]);

      //   if (setViewerCount !== null) setViewerCount((prev: number) => prev + 1);
    },
    [chatMessages]
  );
  const lParticipantDisconnected = useCallback(
    (remoteParticipant: RemoteParticipant) => {
      if (remoteParticipant.permissions?.hidden) return;

      const name = remoteParticipant?.name;
      chatMessages.push({
        timestamp: 0,
        message: "",
        peerName: name,
        isJoined: false,
      });

      //   setChatMessages((oldArray: MESSAGE[]) => [
      //     ...oldArray,
      //     {
      //       senderName:
      //         name?.slice(0, 2) === "0x" ? shortenAddress(name as ADDRESS) : name,
      //       peerStatus: "left",
      //     },
      //   ]);

      //   if (setViewerCount !== null) setViewerCount((prev: number) => prev - 1);
    },
    [chatMessages]
  );
  useEffect(() => {
    room?.on(RoomEvent.ParticipantConnected, lParticipantConnected);
    room?.on(RoomEvent.ParticipantDisconnected, lParticipantDisconnected);
    return () => {
      room?.off(RoomEvent.ParticipantConnected, lParticipantConnected);
      room?.off(RoomEvent.ParticipantDisconnected, lParticipantDisconnected);
    };
  }, [room, lParticipantConnected, lParticipantDisconnected]);

  //   console.log(participants); // TODO: test is this the array to get when new users join?

  const [isInit, setIsInit] = useState<boolean>(false);
  useEffect(() => {
    const sendInitMessage = async () => {
      if (!isStudio || !isConnected || isInit || send === undefined) return;
      await send("Livestream starts.");
      setIsInit(true);
    };
    void sendInitMessage();
  }, [isStudio, isConnected, isInit, send]);

  const isDisableChatInput =
    !isConnected ||
    !refMessageInput?.current ||
    isSending ||
    (isStudio && !isInit);

  return (
    <Box sx={{ height: "100%" }}>
      <List
        sx={{
          // width: "100%",
          height: `calc(100% - ${HEIGHT_CHAT_INPUT}px)`,
          overflowY: "scroll",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "0.1em", // set this to tiny width hide default scrollbar
          },
          // "&::-webkit-scrollbar-track": {
          //   backgroundColor: "secondary.main",
          // },
          //   "&::-webkit-scrollbar-thumb": {
          //     backgroundColor: "primary.main", //isShowScrollbar ? "primary.main" : undefined,
          //   },
          //   "&::-webkit-scrollbar-thumb:hover": {
          //     backgroundColor: "primary.main",
          //   },
          //   border: 2,
        }}
      >
        {chatMessages.map((value, index) => {
          const name = value.from?.name ?? "unknown";
          return (
            <>
              {value.timestamp === 0 ? (
                <ListItem
                  key={index}
                  sx={{ p: 0.3, bgcolor: "backgroundTwo.main" }}
                >
                  <Typography
                    sx={{
                      maxWidth: "100%",
                      wordWrap: "break-word",
                      fontWeight: "bold",
                      color: value.isJoined ? "success.main" : "warning.main",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        display: "inline",
                        color: "#000000",
                        bgcolor: selectColor(
                          stringNumber(value.peerName ?? "")
                        ),
                        border: 1,
                        borderRadius: 1,
                        px: 0.2,
                        py: 0.1,
                      }}
                    >
                      {value.peerName}
                    </Typography>{" "}
                    {value.isJoined ? "joined" : "left"}
                  </Typography>
                </ListItem>
              ) : (
                <ListItem key={index} sx={{ p: 0.3 }}>
                  <Typography sx={{ maxWidth: "100%", wordWrap: "break-word" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: "bold",
                        display: "inline",
                        color: "#000000",
                        bgcolor: selectColor(stringNumber(name)),
                        border: 1,
                        borderRadius: 1,
                        px: 0.2,
                        py: 0.1,
                      }}
                    >
                      {name}
                    </Typography>{" "}
                    {value.message}
                  </Typography>
                </ListItem>
              )}
            </>
          );
        })}
        <li ref={refMessages}></li>
      </List>
      <Box sx={{ height: HEIGHT_CHAT_INPUT }}>
        <TextField
          fullWidth
          variant="filled"
          disabled={isDisableChatInput}
          placeholder="send a message"
          value={message}
          inputRef={refMessageInput}
          inputProps={{ maxLength: 100, autoComplete: "off" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  disabled={isDisableChatInput || !send}
                  onClick={handleSendMessage}
                >
                  <SendOutline />
                </IconButton>
              </InputAdornment>
            ),
          }}
          onChange={(event) => {
            const value = event.target.value;
            setMessage(value);
            // if (value.trim() !== "" || message !== "") {
            //   setMessage(value);
            // }
            // if (value !== "\n") {
            //     setMessage(value);
            //   }
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              await handleSendMessage();
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default Chat;
