import { isMobileDevice } from "~/utils/device";
import Image from "next/image";

import { useRouter } from "next/router";
import { useTheme } from "../../contexts/Theme";
import { useAuthentication } from "~/contexts/Authentication";

import Stack from "@mui/material/Stack";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";

import PersonOutline from "../icons/PersonOutline";
import MoonOutline from "../icons/MoonOutline";
import SunOutline from "../icons/SunOutline";
import RadioButtonOnOutline from "../icons/RadioButtonOnOutline";
import ArrowUpOutline from "../icons/ArrowUpOutline";
import ExitOutline from "../icons/ExitOutline";
import ChevronDownOutline from "../icons/ChevronDownOutline";
import ChevronForwardOutline from "../icons/ChevronForwardOutline";
import GlobeOutline from "../icons/GlobeOutline";

import { HEIGHT_HEADER } from "./Header";

// import logo3 from "../../assets/logo3_crop.png";

import { useState } from "react";
import { useAppStates } from "~/contexts/AppStates";
import useScreenSize from "~/hooks/common/useScreenSize";

import zeauxs from "~/assets/zeau-xs-crop.png";

import { PRIMARY_COLOR } from "../../contexts/Theme";
import {
  ROUTE_HOME,
  ROUTE_EXPLORE,
  ROUTE_STUDIO,
  ROUTE_PROFILE,
  ROUTE_WITHDRAW,
  FLOW_POOL_URL,
} from "~/constants/common";

export const WIDTH_LEFT_BAR = 260;

const LeftBar = () => {
  const { pathname, push: navigateTo } = useRouter();
  const { isLeftBarOpened, setIsLeftBarOpened } = useAppStates();
  const { isWide } = useScreenSize();
  const { isDark, toggleColorScheme } = useTheme();
  const { logout } = useAuthentication();
  const [isMoreOpened, setIsMoreOpened] = useState<boolean>(false);

  return (
    <Drawer
      open={!isMobileDevice() && isLeftBarOpened}
      onClose={() => {
        setIsLeftBarOpened(false);
      }}
      variant={isWide ? "persistent" : "temporary"} // "temporary"
      PaperProps={{ sx: { width: WIDTH_LEFT_BAR } }}
    >
      <Stack justifyContent="space-between" sx={{ height: "100vh", py: 2 }}>
        <Stack spacing={3}>
          <Stack
            alignItems="center"
            justifyContent="center"
            height={HEIGHT_HEADER}
          >
            <IconButton
              onClick={async () => {
                await navigateTo(ROUTE_HOME);
              }}
            >
              <Image src={zeauxs} alt="zeau" width={90} />
              {/* <Wave1 width={100} color={PRIMARY_COLOR} /> */}
            </IconButton>
          </Stack>

          <Stack>
            <List>
              {/* <ListItemButton
                selected={pathname === ROUTE_EXPLORE}
                onClick={async () => {
                  await navigateTo(ROUTE_EXPLORE);
                  //   setIsLeftBarOpened(false);
                }}
              >
                <ListItemIcon>{<SearchOutline />}</ListItemIcon>
                <ListItemText primary="Explore" />
              </ListItemButton> */}

              <ListItemButton
                selected={pathname === ROUTE_STUDIO}
                onClick={async () => {
                  await navigateTo(ROUTE_STUDIO);
                  //   setIsLeftBarOpened(false);
                }}
              >
                <ListItemIcon>{<RadioButtonOnOutline />}</ListItemIcon>
                <ListItemText primary="Go Live" />
              </ListItemButton>

              <ListItemButton
                onClick={() => {
                  setIsMoreOpened((prev) => !prev);
                }}
              >
                <ListItemIcon>
                  {isMoreOpened ? (
                    <ChevronDownOutline />
                  ) : (
                    <ChevronForwardOutline />
                  )}
                </ListItemIcon>
                <ListItemText primary="More" />
              </ListItemButton>

              <Collapse in={isMoreOpened} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2 }}>
                  <ListItemButton
                    onClick={async () => {
                      await navigateTo(ROUTE_PROFILE);
                      //   setIsLeftBarOpened(false);
                    }}
                  >
                    <ListItemIcon>{<PersonOutline />}</ListItemIcon>
                    <ListItemText primary="Profile" />
                  </ListItemButton>

                  <ListItemButton
                    onClick={() => {
                      window.open(FLOW_POOL_URL, "_blank", "noopener");
                    }}
                  >
                    <ListItemIcon>{<GlobeOutline />}</ListItemIcon>
                    <ListItemText primary="Pool" />
                  </ListItemButton>

                  {process.env.NODE_ENV === "development" && (
                    <ListItemButton
                      onClick={async () => {
                        await navigateTo(ROUTE_WITHDRAW);
                      }}
                    >
                      <ListItemIcon>{<ArrowUpOutline />}</ListItemIcon>
                      <ListItemText primary="Withdraw" />
                    </ListItemButton>
                  )}

                  <ListItemButton
                    disabled={!logout}
                    onClick={async () => {
                      await logout?.();
                    }}
                  >
                    <ListItemIcon>{<ExitOutline />}</ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItemButton>

                  {process.env.NODE_ENV === "development" && (
                    <ListItemButton
                      selected={pathname === "/testroom"}
                      onClick={async () => {
                        await navigateTo("/testroom");
                        //   setIsLeftBarOpened(false);
                      }}
                    >
                      <ListItemIcon>{<PersonOutline />}</ListItemIcon>
                      <ListItemText primary={"test room 2"} />
                    </ListItemButton>
                  )}
                </List>
              </Collapse>
            </List>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{ height: 50 }}
        >
          <IconButton onClick={toggleColorScheme}>
            {isDark ? <MoonOutline /> : <SunOutline />}
          </IconButton>
        </Stack>
      </Stack>
    </Drawer>
  );
};

export default LeftBar;

// get icons first choice: https://ionic.io/ionicons
// get icons second choice: https://jam-icons.com/
