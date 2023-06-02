import { type BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useIsFeeEnabled from "./useIsFeeEnabled";

const useFeeSize = () => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();
  const { isFeeEnabled } = useIsFeeEnabled();

  const { data: feeSize_ } = useContractRead({
    address: addressApp,
    abi: ["function getBPSSize() external view returns (uint256)"],
    functionName: "getBPSSize",
    enabled: isConnected && isFeeEnabled,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const feeSize = feeSize_ ? feeSize_.toNumber() : 0;

  return { feeSize };
};

export default useFeeSize;
