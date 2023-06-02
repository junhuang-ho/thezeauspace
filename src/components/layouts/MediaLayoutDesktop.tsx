import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import Chat from "../chat/Chat";

import { HEIGHT_HEADER } from "./Header";

export const HEIGHT_VIDEO_SCREEN = "70vh";

const MediaLayoutDesktop = ({ children }: { children: JSX.Element }) => {
  return (
    <Stack direction="row" sx={{ width: "100%" }}>
      <Box sx={{ width: "75%" }}>{children}</Box>
      <Box
        sx={{
          width: "25%",
          height: `calc(100vh - ${HEIGHT_HEADER}px)`,
        }}
      >
        <Chat />
      </Box>
    </Stack>
  );
};

export default MediaLayoutDesktop;
