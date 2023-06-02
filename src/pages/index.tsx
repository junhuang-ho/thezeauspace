import { type NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import { isMobileDevice } from "~/utils/device";

// import { useRef } from "react";
import { useRouter } from "next/router";
import useScreenSize from "~/hooks/common/useScreenSize";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Explore from "~/components/explore/Explore";

import { ROUTE_STUDIO, FLOW_POOL_URL } from "~/constants/common";

import { env } from "~/env.mjs";
import zeausm from "~/assets/zeau-sm-crop.png";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

const Home: NextPage = () => {
  const { push: navigateTo } = useRouter();
  const { isWide } = useScreenSize();

  //   const tawkMessengerRef = useRef();

  return (
    <>
      <Head>
        <title>zeau</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%", py: 2 }}
      >
        {/* <Typography
          variant="h1"
          align="center"
          sx={{ fontWeight: "bold", fontFamily: "MinecrafterReg" }}
        >
          zeau
        </Typography> */}
        <Image alt="zeau" src={zeausm} priority />
        <Typography
          variant="h5"
          align="center"
          color="primary"
          sx={{ fontWeight: "bold" }}
        >
          Web3 Livestreaming
        </Typography>
        <Stack direction="row" spacing={isWide ? 30 : 5} sx={{ my: 8 }}>
          <Typography
            component={"span"}
            align="center"
            sx={{ fontWeight: "bold" }}
          >
            Streamers earn{" "}
            <Box
              sx={{
                display: "inline",
                fontStyle: "italic",
                color: "primary.main",
              }}
            >
              every second
            </Box>
          </Typography>
          <Typography
            component={"span"}
            align="center"
            sx={{ fontWeight: "bold" }}
          >
            Only pay for what you{" "}
            <Box
              sx={{
                display: "inline",
                fontStyle: "italic",
                color: "primary.main",
              }}
            >
              watch
            </Box>
          </Typography>
        </Stack>
        {isMobileDevice() ? (
          <Stack alignItems="center" spacing={1}>
            <Typography align="center">Available on desktop</Typography>
          </Stack>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <Chip
              label="How it works"
              onClick={() => {
                window.open(
                  "https://excalidraw.com/#json=w0ZUXwocwXJLlMpceNZ7e,Ma4eZm1DgowSW21E3mY13w",
                  "_blank",
                  "noopener"
                );
              }}
            />
            <Chip
              label="How it works (static)"
              onClick={() => {
                window.open(
                  "https://github.com/junhuang-ho/miscellaneous/blob/44f68834824a96412b72f10a9cb72685380f91f8/zeau.png",
                  "_blank",
                  "noopener"
                );
              }}
            />
            <Chip
              label="Go Live"
              onClick={async () => {
                await navigateTo(ROUTE_STUDIO);
              }}
            />
            <Chip
              label="Open Pool"
              onClick={() => {
                window.open(FLOW_POOL_URL, "_blank", "noopener");
              }}
            />
          </Stack>
        )}

        {!isMobileDevice() && (
          <Box sx={{ width: "100%", pt: 10 }}>
            <Explore />
          </Box>
        )}

        <TawkMessengerReact
          propertyId={env.NEXT_PUBLIC_TAWK_PROPERTY_ID}
          widgetId={env.NEXT_PUBLIC_TAWK_WIDGET_ID}
          //   ref={tawkMessengerRef}
          customStyle={{
            visibility: {
              desktop: {
                xOffset: "15",
                yOffset: "15",
                position: "bl",
              },

              //   mobile: {
              //     xOffset: 15,
              //     yOffset: 15,
              //     position: "bl",
              //   },
            },
          }}
          //   onLoad={() => {
          //     // if (!tawkMessengerRef) return
          //     tawkMessengerRef?.current?.widgetPosition() = "br";
          //   }}
        />
      </Stack>
    </>
  );
};

export default Home;

// TOOD: con't... hooks to interact with contract
