import Chip from "@mui/material/Chip";

const LiveIndicator = () => {
  return (
    <>
      <Chip
        label="LIVE"
        size="small"
        color="error"
        sx={{
          position: "absolute",
          top: 0,
          right: 10,
          fontWeight: "bold",
          zIndex: 99,
        }}
      />
      <Chip
        label="LIVE"
        size="small"
        color="error"
        sx={{
          position: "absolute",
          top: 0,
          right: 10,
          fontWeight: "bold",
          color: "error.main",
          animation: "ripple 5s infinite ease-in-out",
          "@keyframes ripple": {
            "0%": {
              transform: "scale(.8)",
              opacity: 1,
            },
            "100%": {
              transform: "scale(1.5)",
              opacity: 0,
            },
          },
        }}
      />
    </>
  );
};

export default LiveIndicator;
