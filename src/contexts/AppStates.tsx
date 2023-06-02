import type { Dispatch, SetStateAction } from "react";
import { polygon } from "wagmi/chains";

import { createContext, useContext, useState, useEffect } from "react";
import { useNetwork, type Address } from "wagmi";
import { useIdle } from "@mantine/hooks";
import useScreenSize from "~/hooks/common/useScreenSize";

import { NETWORK_CONFIG_DEFAULT, NETWORK_CONFIGS } from "~/constants/common";

export interface IAppStatesContext {
  isIdle: boolean;
  isLeftBarOpened: boolean;
  isConnectOptionsOpened: boolean;
  isDeployingAccount: boolean;
  isProgressBarDisplayed: boolean;
  isLive: boolean;
  addressApp: Address;
  addressUSDC: Address;
  addressUSDCx: Address;
  addressGelatoTreasury: Address;
  addressSFCFAV1: Address;
  setIsLeftBarOpened: Dispatch<SetStateAction<boolean>>;
  setIsConnectOptionsOpened: Dispatch<SetStateAction<boolean>>;
  setIsDeployingAccount: Dispatch<SetStateAction<boolean>>;
  setIsProgressBarDisplayed: Dispatch<SetStateAction<boolean>>;
  setIsLive: Dispatch<SetStateAction<boolean>>;
}

// export const AppStatesContext = createContext<IAppStatesContext>(
//   {} as IAppStatesContext
// );

export const AppStatesContext = createContext<IAppStatesContext>({
  isIdle: false,
  isLeftBarOpened: false,
  isConnectOptionsOpened: false,
  isDeployingAccount: false,
  isProgressBarDisplayed: false,
  isLive: false,
  addressApp: NETWORK_CONFIG_DEFAULT.addrApp,
  addressUSDC: NETWORK_CONFIG_DEFAULT.addrUSDC,
  addressUSDCx: NETWORK_CONFIG_DEFAULT.addrUSDCx,
  addressGelatoTreasury: NETWORK_CONFIG_DEFAULT.addrGelTreasury,
  addressSFCFAV1: NETWORK_CONFIG_DEFAULT.addrSFCFAV1,
  setIsLeftBarOpened: () => {},
  setIsConnectOptionsOpened: () => {},
  setIsDeployingAccount: () => {},
  setIsProgressBarDisplayed: () => {},
  setIsLive: () => {},
});

export const useAppStates = (): IAppStatesContext => {
  return useContext(AppStatesContext);
};

const AppStatesProvider = ({ children }: { children: JSX.Element }) => {
  const isIdle = useIdle(1_000 * 60);
  const { isMobile, isBelowWide } = useScreenSize();
  const [isLeftBarOpened, setIsLeftBarOpened] = useState<boolean>(!isMobile);
  const [isConnectOptionsOpened, setIsConnectOptionsOpened] =
    useState<boolean>(false);
  const [isDeployingAccount, setIsDeployingAccount] = useState<boolean>(false);
  const [isProgressBarDisplayed, setIsProgressBarDisplayed] =
    useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    if (isBelowWide) setIsLeftBarOpened(false);
  }, [isBelowWide]);

  const { chain: currentChain } = useNetwork();
  const currentChainId = currentChain?.id ?? polygon.id;
  const addressApp =
    NETWORK_CONFIGS[currentChainId]?.addrApp ?? NETWORK_CONFIG_DEFAULT.addrApp;
  const addressUSDC =
    NETWORK_CONFIGS[currentChainId]?.addrUSDC ??
    NETWORK_CONFIG_DEFAULT.addrUSDC;
  const addressUSDCx =
    NETWORK_CONFIGS[currentChainId]?.addrUSDCx ??
    NETWORK_CONFIG_DEFAULT.addrUSDCx;
  const addressGelatoTreasury =
    NETWORK_CONFIGS[currentChainId]?.addrGelTreasury ??
    NETWORK_CONFIG_DEFAULT.addrGelTreasury;
  const addressSFCFAV1 =
    NETWORK_CONFIGS[currentChainId]?.addrSFCFAV1 ??
    NETWORK_CONFIG_DEFAULT.addrSFCFAV1;

  const contextProvider = {
    isIdle,
    isLeftBarOpened,
    isConnectOptionsOpened,
    isDeployingAccount,
    isProgressBarDisplayed,
    isLive,
    addressApp,
    addressUSDC,
    addressUSDCx,
    addressGelatoTreasury,
    addressSFCFAV1,
    setIsLeftBarOpened,
    setIsConnectOptionsOpened,
    setIsDeployingAccount,
    setIsProgressBarDisplayed,
    setIsLive,
  };
  return (
    <AppStatesContext.Provider value={contextProvider}>
      {children}
    </AppStatesContext.Provider>
  );
};

export default AppStatesProvider;
