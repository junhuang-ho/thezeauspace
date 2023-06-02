import { type BigNumber } from "ethers";

import { useContractRead, useAccount, type Address } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";
import useUserDeposit from "./useUserDeposit";

import { ZERO_BIG_NUMBER } from "~/constants/common";

const useUserEffectiveDeposit = (addressToken: Address) => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();

  const { data: amountFlowed_, refetch: refetchAmountFlowed } = useContractRead(
    {
      address: addressApp,
      abi: [
        "function getAmountFlowed(address _user, address _superToken) external view returns (uint256)",
      ],
      functionName: "getAmountFlowed",
      args: [addressWallet, addressToken],
      enabled: isConnected,
      watch: isConnected && !isIdle,
      select: (data) => {
        if (!data) return;
        return data as BigNumber;
      },
    }
  );
  const amountFlowed = amountFlowed_ ?? ZERO_BIG_NUMBER;

  const { userDeposit, refetchUserDeposit } = useUserDeposit(addressToken);
  const effectiveDeposit = userDeposit.sub(amountFlowed);

  const fetchUserEffectiveDeposit = async () => {
    await refetchUserDeposit();
    await refetchAmountFlowed();
  };

  return { effectiveDeposit, fetchUserEffectiveDeposit };
};

export default useUserEffectiveDeposit;
