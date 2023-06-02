import { type BigNumber } from "ethers";

import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useMinimumEndDuration = () => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: minEndDuration_ } = useContractRead({
    address: addressApp,
    abi: ["function getMinimumEndDuration() external view returns (uint256)"],
    functionName: "getMinimumEndDuration",
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });
  const minEndDuration = minEndDuration_ ?? 0;

  return { minEndDuration };
};

export default useMinimumEndDuration;
