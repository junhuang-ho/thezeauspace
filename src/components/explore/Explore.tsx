import { api } from "~/utils/api";
import dynamic from "next/dynamic";
import { type Address } from "wagmi";

import { useRouter } from "next/router";
import { useAppStates } from "~/contexts/AppStates";
import { useTheme } from "~/contexts/Theme";

import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";

import { getImagePath } from "~/utils/common";

const LiveIndicator = dynamic(
  () => import("~/components/studio/LiveIndicator")
);

const Explore = () => {
  const { push: navigateTo } = useRouter();
  const { isIdle } = useAppStates();
  const { isDark } = useTheme();

  const { data: sessions } = api.session.getSessions.useQuery(undefined, {
    refetchInterval: isIdle ? 0 : 1_000 * 5,
    refetchIntervalInBackground: false,
    enabled: true,
  });

  const { mutateAsync: getOtherProfile } =
    api.profile.getOtherProfile.useMutation();

  return (
    <Grid container spacing={2} sx={{ width: "100%", p: 2 }}>
      {sessions !== undefined && sessions?.length > 0 && (
        <>
          {sessions?.map((session) => (
            <Grid xs={12} sm={3} md={3} lg={2} key={session.address}>
              <Card sx={{ bgcolor: isDark ? undefined : "#FFF5EE" }}>
                <CardActionArea
                  onClick={async () => {
                    const data = await getOtherProfile({
                      addressOther: session.address as Address,
                    });
                    if (data === null) {
                      await navigateTo(`/${session.address}`);
                    } else {
                      await navigateTo(`/${data.username}`);
                    }
                  }}
                >
                  <CardContent>
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      spacing={1}
                      sx={{ height: 220 }}
                    >
                      {/* <Avatar sx={{ width: 128, height: 128 }}>
                        {session.name.at(0)}
                      </Avatar> */}

                      <Avatar
                        alt={session.name.at(0)}
                        src={getImagePath(session.address as Address)}
                        sx={{ width: 128, height: 128 }}
                      />
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
