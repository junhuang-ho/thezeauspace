import { type BigNumber, ethers } from "ethers";
import { type Address } from "wagmi";

import { useContractRead, useAccount } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useSessionData = (
  addressUser?: Address,
  addressToken?: string,
  nonce?: number
) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: sessionData_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getSessionData(address _user, address _superToken, uint256 _nonce) external view returns (int96, uint96, uint256, uint256)",
    ],
    functionName: "getSessionData",
    args: [addressUser, addressToken, nonce],
    enabled:
      isConnected &&
      addressUser !== undefined &&
      addressToken !== undefined &&
      nonce !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as [BigNumber, BigNumber, BigNumber, BigNumber];
    },
  });
  const flowRateEffective = sessionData_ ? sessionData_[0] : ZERO_BIG_NUMBER;
  const flowRateTotal = sessionData_ ? sessionData_[1] : ZERO_BIG_NUMBER;
  const timestampStart = sessionData_ ? Number(sessionData_[2].toString()) : 0;
  const timestampStop = sessionData_ ? Number(sessionData_[3].toString()) : 0;

  return { flowRateEffective, flowRateTotal, timestampStart, timestampStop };
};

export default useSessionData;
