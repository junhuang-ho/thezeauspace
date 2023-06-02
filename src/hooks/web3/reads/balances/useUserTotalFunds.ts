import { useAppStates } from "~/contexts/AppStates";
import useUserBalance from "./useUserBalance";
import useUserEffectiveDeposit from "./useUserEffectiveDeposit";

const useUserTotalFunds = () => {
  const { addressUSDC, addressUSDCx } = useAppStates();

  const { balance: balanceUSDC, refetch: fetchBalanceUSDC } =
    useUserBalance(addressUSDC);
  const { balance: balanceUSDCx, refetch: fetchBalanceUSDCx } =
    useUserBalance(addressUSDCx);
  const { effectiveDeposit, fetchUserEffectiveDeposit } =
    useUserEffectiveDeposit(addressUSDCx);

  const totalFunds = balanceUSDC.add(balanceUSDCx).add(effectiveDeposit);

  const fetchBroadcasterBalance = async () => {
    await fetchBalanceUSDC();
    await fetchBalanceUSDCx();
    await fetchUserEffectiveDeposit();
  };

  return {
    totalFunds,
    balanceUSDC,
    balanceUSDCx,
    effectiveDeposit,
    fetchBroadcasterBalance,
  };
};

export default useUserTotalFunds;
