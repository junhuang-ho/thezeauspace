import { useRemoteParticipants } from "@livekit/components-react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import EyeOutline from "../icons/EyeOutline";

const ViewerCount = () => {
  const participants = useRemoteParticipants();
  const participantCount = participants.length;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
    >
      <EyeOutline />
      <Typography>{participantCount}</Typography>
    </Stack>
  );
};

export default ViewerCount;
