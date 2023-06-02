import { ethers } from "ethers";

import { useContractRead, useAccount, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useHasActiveFlow = (addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const { data: hasActiveFlow_ } = useContractRead({
    address: addressApp,
    abi: [
      "function hasActiveFlow(address _user, address _superToken) external view returns (bool)",
    ],
    functionName: "hasActiveFlow",
    args: [addressWallet, addressToken as Address],
    enabled:
      isConnected &&
      addressToken !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as boolean;
    },
  });
  const hasActiveFlow = hasActiveFlow_ ?? false;

  return { hasActiveFlow };
};

export default useHasActiveFlow;
