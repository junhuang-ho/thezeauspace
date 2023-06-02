import { type BigNumber, ethers } from "ethers";

import { useContractRead, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useNewFlowNonce = (addressUser?: Address, addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: newFlowNonce_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getNewFlowNonce(address _user, address _superToken) external view returns (uint256)",
    ],
    functionName: "getNewFlowNonce",
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
  const newFlowNonce = newFlowNonce_ ? newFlowNonce_.toNumber() : 0;

  return { newFlowNonce };
};

export default useNewFlowNonce;
