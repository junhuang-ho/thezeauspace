import { type BigNumber } from "ethers";

import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useAppSuperTokenBufferDuration = () => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: bufferDuration_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getSTBufferDurationInSecond() external view returns (uint256)",
    ],
    functionName: "getSTBufferDurationInSecond",
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return (data as BigNumber).toNumber();
    },
  });
  const appSuperTokenBufferDuration = bufferDuration_ ?? 0;

  return { appSuperTokenBufferDuration };
};

export default useAppSuperTokenBufferDuration;
