import { type BigNumber } from "ethers";

import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

import { ZERO_BIG_NUMBER, ADDRESS_GELATO_FEE } from "~/constants/common";

const useIsSufficientAppGelatoBalance = () => {
  const { isIdle, addressApp, addressGelatoTreasury } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: minGelatoTreasuryBalance_ } = useContractRead({
    address: addressApp,
    abi: [
      "function getMinimumAppGelatoBalance() external view returns (uint256)",
    ],
    functionName: "getMinimumAppGelatoBalance",
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const minGelatoTreasuryBalance = minGelatoTreasuryBalance_ ?? ZERO_BIG_NUMBER;

  const { data: appGelatoBalance_ } = useContractRead({
    address: addressGelatoTreasury,
    abi: [
      "function userTokenBalance(address _user, address _fee) external view returns (uint256)",
    ],
    functionName: "userTokenBalance",
    args: [addressApp, ADDRESS_GELATO_FEE],
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as BigNumber;
    },
  });
  const appGelatoBalance = appGelatoBalance_ ?? ZERO_BIG_NUMBER;
  const isSufficientAppGelatoBalance = appGelatoBalance.gt(
    minGelatoTreasuryBalance
  );

  return { isSufficientAppGelatoBalance };
};

export default useIsSufficientAppGelatoBalance;
