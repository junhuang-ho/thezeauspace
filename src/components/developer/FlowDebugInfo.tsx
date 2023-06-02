import { ethers } from "ethers";

import { useAccount } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import useUserBalance from "~/hooks/web3/reads/balances/useUserBalance";
import useAppBalance from "~/hooks/web3/reads/balances/useAppBalance";
import useUserDeposit from "~/hooks/web3/reads/balances/useUserDeposit";
import useUserEffectiveDeposit from "~/hooks/web3/reads/balances/useUserEffectiveDeposit";
import useNewFlowNonce from "~/hooks/web3/reads/flows/useNewFlowNonce";
import useFlowData from "~/hooks/web3/reads/flows/useFlowData";

import Box from "@mui/material/Box";

import { truncateEthAddress } from "~/utils/common";

const FlowDebugInfo = ({
  isViewSessionAllowed,
}: {
  isViewSessionAllowed: boolean;
}) => {
  const { addressUSDC, addressUSDCx } = useAppStates();
  const { address: addressWallet } = useAccount();
  const { appBalance: appUSDCxBalance } = useAppBalance(addressUSDCx);
  const { balance: USDCBalance } = useUserBalance(addressUSDC);
  const { balance: USDCxBalance } = useUserBalance(addressUSDCx);

  const { userDeposit } = useUserDeposit(addressUSDCx);
  const { effectiveDeposit } = useUserEffectiveDeposit(addressUSDCx);

  const { newFlowNonce } = useNewFlowNonce(addressWallet, addressUSDCx);
  const {
    receiver,
    sessionNonce,
    timestampIncrease,
    timestampDecrease,
    taskId,
  } = useFlowData(addressUSDCx, newFlowNonce > 0 ? newFlowNonce - 1 : 0);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 500,
        right: 30,
        fontSize: 10,
        bgcolor: "background.paper",
        zIndex: 999,
        fontWeight: "bold",
        opacity: 0.9,
      }}
    >
      <div>-- debug --</div>
      <div>App Balance USDCx: {ethers.utils.formatEther(appUSDCxBalance)}</div>
      <div>User Deposit USDCx: {ethers.utils.formatEther(userDeposit)}</div>
      <div>
        User Deposit Eff USDCx: {ethers.utils.formatEther(effectiveDeposit)}
      </div>
      <div>Wal Balance USDCx: {ethers.utils.formatEther(USDCxBalance)}</div>
      <div>Wal Balance USDC: {ethers.utils.formatEther(USDCBalance)}</div>

      <div>Next Nonce: {newFlowNonce}</div>
      <div>Broadcaster Address: {truncateEthAddress(receiver)}</div>
      <div>Broadcaster Nonce:{sessionNonce}</div>
      <div>Timestamp Increase: {timestampIncrease}</div>
      <div>Timestamp Decrease: {timestampDecrease}</div>
      <div>Task Id: {taskId}</div>
      <div>
        {isViewSessionAllowed ? "Allowed" : "NOT Allowed"} to view session
      </div>
      <div>{!isViewSessionAllowed && "session not live OR no flow opened"}</div>
    </Box>
  );
};

export default FlowDebugInfo;
