import { type BigNumber } from "ethers";

import { useContractRead, useAccount, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useFlowAppToUser = (addressToken: Address) => {
  const { isIdle, addressApp, addressSFCFAV1 } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const { data: flowRate_ } = useContractRead({
    address: addressSFCFAV1,
    abi: [
      "function getFlow(address token, address sender, address receiver) external view returns (uint256, int96, uint256, uint256)",
    ],
    functionName: "getFlow",
    args: [addressToken, addressApp, addressWallet],
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      const data_ = data as [BigNumber, BigNumber, BigNumber, BigNumber];
      return data_[1];
    },
  });
  const flowRate = flowRate_ ? flowRate_ : ZERO_BIG_NUMBER;

  return { flowRate };
};

export default useFlowAppToUser;
