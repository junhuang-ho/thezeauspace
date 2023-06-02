import { useRouter } from "next/router";
// import { useReducer } from "react";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useInterval from "~/hooks/common/useInterval";
import useTokenSymbol from "~/hooks/web3/reads/utils/useTokenSymbol";
import useFlowAppToUser from "~/hooks/web3/reads/flows/useFlowAppToUser";
import useFlowUserToUser from "~/hooks/web3/reads/flows/useFlowUserToUser";
import useHasActiveFlow from "~/hooks/web3/reads/flows/useHasActiveFlow";
import useUserTotalFunds from "~/hooks/web3/reads/balances/useUserTotalFunds";

import Typography from "@mui/material/Typography";

import FlowingBalance from "./FlowingBalance";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const Balance = () => {
  const { pathname } = useRouter();
  const isStudio = pathname === "/studio";
  const { isIdle, addressUSDC, addressUSDCx } = useAppStates();
  const { isConnected: isUserConnected } = useAuthentication();

  const { symbol: symbolUSDC } = useTokenSymbol(addressUSDC);
  const { totalFunds: balanceTotal, fetchBroadcasterBalance } =
    useUserTotalFunds();

  const { flowRate: flowRateAppToUser } = useFlowAppToUser(addressUSDCx);
  const { flowRateTotal, timestampIncrease } = useFlowUserToUser(addressUSDCx);
  const now = Math.floor(Date.now() / 1000);
  const activeCumulativeAmount = flowRateTotal.mul(now - timestampIncrease);

  const { hasActiveFlow: isActiveFlow } = useHasActiveFlow(addressUSDCx);

  const balance = isActiveFlow
    ? balanceTotal.sub(activeCumulativeAmount)
    : balanceTotal;
  const flowRate = flowRateAppToUser.sub(
    isActiveFlow ? flowRateTotal : ZERO_BIG_NUMBER
  );

  // eslint-disable-next-line
  //   const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useInterval(
    async () => {
      await fetchBroadcasterBalance();
      console.log("render balance");
    },
    isUserConnected && isIdle && isStudio && flowRateAppToUser.gt(0)
      ? 1_000 * 5 // TODO: set this to a more sustainable value
      : null
  ); // to make balance when in live studio more responsive

  return (
    <Typography
      //   color="primary"
      sx={{
        fontWeight: "bold",
        color: isStudio && flowRate.gt(0) ? "#FFD700" : "primary.main",
      }}
    >
      <FlowingBalance
        balance={balance}
        balanceTimestamp={now}
        flowRate={flowRate}
      />{" "}
      {symbolUSDC}
    </Typography>
  );
};

export default Balance;
// TODO: test
