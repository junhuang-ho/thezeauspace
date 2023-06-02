import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useScreenSize from "~/hooks/common/useScreenSize";

import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import CircularProgress from "@mui/material/CircularProgress";

import { PRIMARY_COLOR } from "~/contexts/Theme";

const CONNECTOR_ICONS = {
  twitter: "https://cdn3.iconfinder.com/data/icons/inficons/512/twitter.png",
  google:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/2048px-Google_%22G%22_Logo.svg.png",
  twitch:
    "https://cdn4.iconfinder.com/data/icons/logos-brands-7/512/twitch-1024.png",
  discord:
    "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/91_Discord_logo_logos-512.png",
  facebook:
    "https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Facebook-512.png",
};

const ConnectOptions = () => {
  const {
    // isConnected,
    isConnecting,
    connectors,
    // activeConnector,
    // username,
    login,
    // logout,
  } = useAuthentication();

  const {
    isConnectOptionsOpened,
    isDeployingAccount,
    setIsConnectOptionsOpened,
  } = useAppStates();

  const { isWide } = useScreenSize();

  return (
    <Dialog
      open={isConnectOptionsOpened}
      disableEscapeKeyDown={isConnecting}
      onClose={() => {
        if (isConnecting) return;
        setIsConnectOptionsOpened(false);
      }}
      PaperProps={{ sx: { border: 2, borderColor: PRIMARY_COLOR } }}
      sx={{ height: "70vh" }}
    >
      <DialogTitle align="center" sx={{ fontWeight: "bold" }}>
        {isConnecting ? "Connecting..." : "Login"}
      </DialogTitle>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ px: isWide ? 8 : 3, py: 4 }}
      >
        {isConnecting ? (
          <Stack alignItems="center" justifyContent="center">
            {isDeployingAccount && (
              <ListItemText secondary="First-time logins might take a few minutes, please do not exit page." />
            )}
            <CircularProgress />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {connectors.map((connector) => (
              <Grid
                xs={6}
                sm={3}
                key={connector.id}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ButtonBase
                  disabled={!connector.ready || !login || isConnecting}
                  onClick={async () => {
                    await login?.(connector);
                  }}
                >
                  <Avatar
                    alt={connector.id}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    src={
                      CONNECTOR_ICONS[
                        connector.id as keyof typeof CONNECTOR_ICONS
                      ]
                    }
                    sx={{ width: 24, height: 24, bgcolor: "#fff" }}
                  />
                  {/* <ListItemText primary={connector.name} /> */}
                </ButtonBase>
              </Grid>
            ))}
          </Grid>
          //   <List component={Stack} direction="row" spacing={2} sx={{ pt: 0 }}>
          //     {connectors.map((connector) => (
          //       <ListItemButton
          //         key={connector.id}
          //         disabled={!connector.ready || !login || isConnecting}
          //         onClick={async () => {
          //           await login?.(connector);
          //         }}
          //       >
          //         <Avatar
          //           alt={connector.id}
          //           // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          //           src={
          //             CONNECTOR_ICONS[
          //               connector.id as keyof typeof CONNECTOR_ICONS
          //             ]
          //           }
          //           sx={{ width: 24, height: 24, bgcolor: "#fff" }}
          //         />
          //         {/* <ListItemText primary={connector.name} /> */}
          //       </ListItemButton>
          //     ))}
          //   </List>
        )}
        <Typography variant="caption" sx={{ pt: 5 }}>
          By logging in, you agree to the{" "}
          <Link
            href="https://docs.google.com/document/d/1XZQV_wCh-ZB9V3MoEoQbybwJBt8N-NSK-JactRc86qs/edit?usp=sharing"
            target="_blank"
            rel="noopener"
          >
            Terms of Service
          </Link>
        </Typography>
      </Stack>
    </Dialog>
  );
};

export default ConnectOptions;
