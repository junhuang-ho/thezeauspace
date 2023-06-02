import { isMobileDevice } from "~/utils/device";
import Image from "next/image";

import { useRouter } from "next/router";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useScreenSize from "~/hooks/common/useScreenSize";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";

import LockOutline from "../icons/LockOutline";
import MenuOutline from "../icons/MenuOutline";

import zeauxs from "~/assets/zeau-xs-crop.png";

import Balance from "../balance/Balance";
import ConnectButton from "../authentication/ConnectButton";
import ConnectOptions from "../authentication/ConnectOptions";
import Notifications from "../utils/Notifications";

import { WIDTH_LEFT_BAR } from "./LeftBar";

import { PRIMARY_COLOR } from "~/contexts/Theme";
import { ROUTE_HOME } from "~/constants/common";

export const HEIGHT_HEADER = 70;

const Header = () => {
  const { isConnected } = useAuthentication();
  const { pathname } = useRouter();
  const isHome = pathname === ROUTE_HOME;
  const {
    isLeftBarOpened,
    isLive,
    isProgressBarDisplayed,
    setIsLeftBarOpened,
  } = useAppStates();
  const { isWide } = useScreenSize();

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        position: "fixed",
        height: HEIGHT_HEADER,
        width: `calc(100% - ${
          isLeftBarOpened && isWide ? WIDTH_LEFT_BAR : 0
        }px)`,
        backgroundColor: "background.paper",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, width: "100%" }}
      >
        <Stack direction="row" alignItems="center" justifyContent="center">
          <IconButton
            disabled={isLive || isMobileDevice()}
            onClick={() => {
              setIsLeftBarOpened((prev) => !prev);
            }}
          >
            {isLeftBarOpened ? (
              <MenuOutline />
            ) : (
              <Box
                sx={{
                  animation: isHome ? "bounce 5s infinite" : undefined,
                  "@keyframes bounce": {
                    "0%, 60%, 90%, 100%": {
                      transform: "translateX(0)",
                    },
                    "70%, 80%": { transform: "translateX(15px)" },
                  },
                }}
              >
                <Image src={zeauxs} alt="zeau" width={90} priority />
              </Box>
            )}
          </IconButton>
          {isLive && (
            <Box>
              <LockOutline />
            </Box>
          )}
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="center">
          {isConnected && <Balance />}
          <Box sx={{ p: 1 }}></Box>
          <ConnectButton />
        </Stack>
      </Stack>
      <Box sx={{ width: "100%" }}>
        {isProgressBarDisplayed && <LinearProgress />}
      </Box>
      <ConnectOptions />
      <Notifications />
    </Stack>
  );
};

export default Header;
