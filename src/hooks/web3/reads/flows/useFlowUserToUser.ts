import { useAccount, type Address } from "wagmi";
import useNewFlowNonce from "./useNewFlowNonce";
import useFlowData from "~/hooks/web3/reads/flows/useFlowData";
import useSessionData from "../sessions/useSessionData";

const useFlowUserToUser = (addressToken: Address) => {
  const { address: addressWallet } = useAccount();

  const { newFlowNonce } = useNewFlowNonce(addressWallet, addressToken);
  const { receiver, sessionNonce, timestampIncrease } = useFlowData(
    addressToken,
    newFlowNonce > 0 ? newFlowNonce - 1 : 0
  );
  const { flowRateTotal } = useSessionData(
    receiver,
    addressToken,
    sessionNonce
  );

  return { flowRateTotal, timestampIncrease };
};

export default useFlowUserToUser;
