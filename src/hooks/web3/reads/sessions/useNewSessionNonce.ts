import { type BigNumber, ethers } from "ethers";

import { useContractRead, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useNewSessionNonce = (addressUser?: Address, addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: newSessionNonce_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getNewSessionNonce(address _user, address _superToken) external view returns (uint256)",
    ],
    functionName: "getNewSessionNonce",
    args: [addressUser, addressToken as Address],
    enabled:
      isConnected &&
      addressToken !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const newSessionNonce = newSessionNonce_ ? newSessionNonce_.toNumber() : 0;

  return { newSessionNonce };
};

export default useNewSessionNonce;
