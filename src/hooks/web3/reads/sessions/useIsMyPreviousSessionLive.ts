import { useAccount } from "wagmi";
import useNewSessionNonce from "./useNewSessionNonce";
import useSessionData from "./useSessionData";

const useIsMyPreviousSessionLive = (addressToken?: string) => {
  const { address: addressWallet } = useAccount();
  const { newSessionNonce } = useNewSessionNonce(addressWallet, addressToken);
  const { timestampStop } = useSessionData(
    addressWallet,
    addressToken,
    newSessionNonce > 0 ? newSessionNonce - 1 : 0
  );
  const isPreviousSessionLive = newSessionNonce > 0 && timestampStop === 0;

  return { isPreviousSessionLive };
};

export default useIsMyPreviousSessionLive;
