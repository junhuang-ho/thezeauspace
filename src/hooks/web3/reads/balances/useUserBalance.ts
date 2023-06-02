import { ethers } from "ethers";

import { type Address, useAccount, useBalance } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useUserBalance = (addressToken?: string) => {
  const { isIdle } = useAppStates();
  const { isConnected } = useAuthentication();
  const { address: addressWallet } = useAccount();

  const { data: balance_, refetch } = useBalance({
    address: addressWallet,
    token: addressToken as Address,
    enabled:
      isConnected &&
      addressToken !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
  });
  const balance = balance_ ? balance_.value : ZERO_BIG_NUMBER;

  return { balance, refetch };
};
export default useUserBalance;
