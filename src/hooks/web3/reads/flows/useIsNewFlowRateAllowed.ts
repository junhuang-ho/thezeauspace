import { type BigNumber, ethers } from "ethers";

import { useContractRead, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useIsNewFlowRateAllowed = (
  newFlowRate: BigNumber,
  addressToken?: string
) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: isNewFlowRateAllowed_ } = useContractRead({
    address: addressApp,
    abi: [
      "function isNewFlowRateAllowed(address _superToken, int96 _newFlowRate) external view returns (bool)",
    ],
    functionName: "isNewFlowRateAllowed",
    args: [addressToken as Address, newFlowRate],
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
  const isSufficientAppSuperTokenBuffer = isNewFlowRateAllowed_ ?? false;

  return { isSufficientAppSuperTokenBuffer };
};

export default useIsNewFlowRateAllowed;
