import { type ReactNode } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import Header, { HEIGHT_HEADER } from "./Header";
import LeftBar, { WIDTH_LEFT_BAR } from "./LeftBar";

import { useAppStates } from "~/contexts/AppStates";
import useScreenSize from "~/hooks/common/useScreenSize";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const { isLeftBarOpened } = useAppStates();
  const { isWide } = useScreenSize();
  return (
    <Stack alignItems="flex-end" sx={{ width: "100%" }}>
      <Header />
      <LeftBar />
      <Box
        sx={{
          width: `calc(100% - ${
            isLeftBarOpened && isWide ? WIDTH_LEFT_BAR : 0
          }px)`,
        }}
      >
        <Box sx={{ height: HEIGHT_HEADER }}></Box>
        <Stack alignItems="center" justifyContent="center">
          {children}
        </Stack>
      </Box>
    </Stack>
  );
};

export default MainLayout;
