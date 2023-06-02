import { ethers } from "ethers";

import { useBalance, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useAppBalance = (addressToken?: string) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: appBalance_ } = useBalance({
    address: addressApp,
    token: addressToken as Address,
    enabled:
      isConnected &&
      addressToken !== undefined &&
      ethers.utils.isAddress(addressToken),
    watch: isConnected && !isIdle,
  });
  const appBalance = appBalance_ ? appBalance_.value : ZERO_BIG_NUMBER;

  return { appBalance };
};

export default useAppBalance;
