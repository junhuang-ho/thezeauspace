import { type BigNumber } from "ethers";

import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useMinimumLifespan = () => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: minLifespan_ } = useContractRead({
    address: addressApp,
    abi: ["function getMinimumLifespan() external view returns (uint256)"],
    functionName: "getMinimumLifespan",
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });
  const minLifespan = minLifespan_ ?? 0;

  return { minLifespan };
};

export default useMinimumLifespan;
