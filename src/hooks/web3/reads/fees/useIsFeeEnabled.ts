import { useContractRead } from "wagmi";
import { useAppStates } from "~/contexts/AppStates";
import { useAuthentication } from "~/contexts/Authentication";

const useIsFeeEnabled = () => {
  const { isIdle, addressApp } = useAppStates();
  const { isConnected } = useAuthentication();

  const { data: isFeeEnabled_ } = useContractRead({
    address: addressApp,
    abi: ["function isBPSEnabled() external view returns (bool)"],
    functionName: "isBPSEnabled",
    enabled: isConnected,
    watch: isConnected && !isIdle,
    select: (data) => {
      if (!data) return;
      return data as boolean;
    },
  });
  const isFeeEnabled = isFeeEnabled_ ?? false;

  return { isFeeEnabled };
};

export default useIsFeeEnabled;
