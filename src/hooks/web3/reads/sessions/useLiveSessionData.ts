import { type BigNumber } from "ethers";

import { useContractRead, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useLiveSessionData = (addressUser?: Address) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: liveSessionData_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getCurrentSessionData(address _user) external view returns (uint256, address[] memory)",
    ],
    functionName: "getCurrentSessionData",
    args: [addressUser],
    enabled: isConnected && addressUser !== undefined,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as [BigNumber, Address[]];
    },
  });
  const timestampLiveStart = liveSessionData_
    ? Number(liveSessionData_[0].toString())
    : 0;
  const superTokensAccepted = liveSessionData_ ? liveSessionData_[1] : [];

  return { timestampLiveStart, superTokensAccepted };
};

export default useLiveSessionData;
