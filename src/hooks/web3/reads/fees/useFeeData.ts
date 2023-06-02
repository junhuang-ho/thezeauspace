import { type BigNumber } from "ethers";

import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useFeeData = (tag: number) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: feeData_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getBPSData(uint256 _tag) external view returns (uint16, uint96, uint96)",
    ],
    functionName: "getBPSData",
    args: [tag],
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as [BigNumber, BigNumber, BigNumber];
    },
  });
  const percentageTake = feeData_ ? Number(feeData_[0].toString()) / 100 : 0;
  const flowRateLowerBound = feeData_ ? feeData_[1] : ZERO_BIG_NUMBER;
  const flowRateUpperBound = feeData_ ? feeData_[2] : ZERO_BIG_NUMBER;

  return { percentageTake, flowRateLowerBound, flowRateUpperBound };
};

export default useFeeData;
