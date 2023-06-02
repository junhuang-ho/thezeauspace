import { ethers } from "ethers";

import { useContractRead, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useIsSuperTokenSupported = (addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: isSupported_ } = useContractRead({
    address: addressApp,
    abi: [
      "function isSuperTokensSupported(address _superToken) external view returns (bool)",
    ],
    functionName: "isSuperTokensSupported",
    args: [addressToken as Address],
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
  const isSupported = isSupported_ ?? false;

  return { isSupported };
};

export default useIsSuperTokenSupported;
