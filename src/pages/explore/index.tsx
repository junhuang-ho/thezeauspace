import { api } from "~/utils/api";
import NextLink from "next/link";
import dynamic from "next/dynamic";
import Head from "next/head";

import { useRouter } from "next/router";
import { useAppStates } from "~/contexts/AppStates";

import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Link from "@mui/material/Link";

const LiveIndicator = dynamic(
  () => import("~/components/studio/LiveIndicator")
);

import { ROUTE_STUDIO } from "~/constants/common";

const Explore = () => {
  const { push: navigateTo } = useRouter();
  const { isIdle } = useAppStates();

  const { data: sessions } = api.session.getSessions.useQuery(undefined, {
    refetchInterval: 1_000 * 5,
    refetchIntervalInBackground: false,
    enabled: !isIdle,
  });

  return (
    <Grid container spacing={2} sx={{ width: "100%", mt: 2 }}>
      <Head>
        <title>zeau | Explore</title>
        <meta name="description" content="Web3 Livestreaming" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {sessions === undefined ||
      (sessions !== undefined && sessions?.length <= 0) ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ width: "100%" }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            No users live
          </Typography>
          <Link
            component={NextLink}
            href={ROUTE_STUDIO}
            // target="_blank"
            // rel="noopener"
            color="primary"
            // variant="caption"
            sx={{ fontWeight: "bold" }}
          >
            Go Live Now!
          </Link>
        </Stack>
      ) : (
        <>
          {sessions?.map((session) => (
            <Grid xs={12} sm={3} md={3} lg={2} key={session.address}>
              <Card>
                <CardActionArea
                  onClick={async () => {
                    await navigateTo(`/${session.address}`);
                  }}
                >
                  <CardContent>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      spacing={1}
                      sx={{ height: 220 }}
                    >
                      <Avatar sx={{ width: 128, height: 128 }}>
                        {session.name.at(0)}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {session.name}
                      </Typography>
                      <Tooltip title={session.title} placement="top">
                        <Typography
                          sx={{
                            // overflow: "hidden",
                            // textOverflow: "ellipsis",
                            // width: "100%",
                            display: "-webkit-box",
                            overflow: "hidden",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            width: "100%",
                          }}
                        >
                          {session.title}
                        </Typography>
                      </Tooltip>
                      <LiveIndicator />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </>
      )}
    </Grid>
  );
};

export default Explore;
