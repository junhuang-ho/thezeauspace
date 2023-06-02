import { type BigNumber, ethers } from "ethers";

import { useContractRead, useAccount, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useUserDeposit = (addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const { data: userDeposit_, refetch: refetchUserDeposit } = useContractRead({
    address: addressApp,
    abi: [
      "function getDepositUser(address _user, address _superToken) external view returns (uint256)",
    ],
    functionName: "getDepositUser",
    args: [addressWallet, addressToken as Address],
    enabled:
      isConnected &&
      addressToken !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const userDeposit = userDeposit_ ?? ZERO_BIG_NUMBER;

  return { userDeposit, refetchUserDeposit };
};

export default useUserDeposit;
