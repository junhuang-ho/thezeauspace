import { ethers } from "ethers";

import { useAccount } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import useNewSessionNonce from "~/hooks/web3/reads/sessions/useNewSessionNonce";
import useSessionData from "~/hooks/web3/reads/sessions/useSessionData";
import useLiveSessionData from "~/hooks/web3/reads/sessions/useLiveSessionData";

import Box from "@mui/material/Box";

import { truncateEthAddress } from "~/utils/common";

const SessionDebugInfo = () => {
  const { addressUSDCx } = useAppStates();
  const { address: addressWallet } = useAccount();
  const { newSessionNonce } = useNewSessionNonce(addressWallet, addressUSDCx);
  const { flowRateEffective, flowRateTotal, timestampStart, timestampStop } =
    useSessionData(
      addressWallet,
      addressUSDCx,
      newSessionNonce > 0 ? newSessionNonce - 1 : 0
    );
  const { timestampLiveStart, superTokensAccepted } =
    useLiveSessionData(addressWallet);

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
      <div>Next Nonce: {newSessionNonce}</div>
      <div>Flow Rate Eff: {ethers.utils.formatEther(flowRateEffective)}</div>
      <div>Flow Rate Tot: {ethers.utils.formatEther(flowRateTotal)}</div>
      <div>Timestamp Start: {timestampStart}</div>
      <div>Timestamp Stop: {timestampStop}</div>
      <div>Timestamp Live: {timestampLiveStart}</div>
      <div>ST Acceptable: (address)</div>
      <div>
        <ul>
          {superTokensAccepted.map((v) => (
            <li key={v}>{truncateEthAddress(v)}</li>
          ))}
        </ul>
      </div>
    </Box>
  );
};

export default SessionDebugInfo;
