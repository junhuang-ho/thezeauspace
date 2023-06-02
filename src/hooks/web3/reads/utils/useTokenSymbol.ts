import { useAccount, useBalance, type Address } from "wagmi";
import { useAuthentication } from "~/contexts/Authentication";

const useTokenSymbol = (addressToken?: Address) => {
  const { isConnected } = useAuthentication();

  const { address: addressWallet } = useAccount();
  const { data: nativeBalanceData } = useBalance({
    address: addressWallet,
    token: addressToken, // undefined === native token
    watch: isConnected,
  });
  const symbol = nativeBalanceData ? nativeBalanceData.symbol : "";

  return { symbol };
};

export default useTokenSymbol;
