import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// import { ROUTE_ROOM } from "../constants/common";

const useScreenSize = () => {
  //   const router = useRouter();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isSlim = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));
  const isBelowWide = useMediaQuery(theme.breakpoints.down("lg"));

  return {
    isMobile,
    isSlim,
    isWide,
    isBelowWide,
  };
};

export default useScreenSize;
