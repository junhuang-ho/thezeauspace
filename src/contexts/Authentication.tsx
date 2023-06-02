import { SiweMessage } from "siwe";
import type { Address, Connector } from "wagmi";

import {
  readContract,
  writeContract,
  prepareWriteContract,
} from "wagmi/actions";
import { polygon, polygonMumbai } from "wagmi/chains";

import { api } from "~/utils/api";

import {
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
  type ReactNode,
} from "react";
import { useSession, signIn, signOut, getCsrfToken } from "next-auth/react";
import { useAccount, useSignMessage, useConnect, useDisconnect } from "wagmi";
import { useAppStates } from "./AppStates";
import useAddressMismatch from "~/hooks/common/useAddressMismatch";

import { env } from "~/env.mjs";
import { log } from "next-axiom";
import { truncateEthAddress } from "~/utils/common";
import { NETWORK_CONFIGS } from "~/constants/common";

export interface IAuthenticationContext {
  isConnected: boolean;
  isConnecting: boolean;
  isAppUsername: boolean;
  connectors: Connector<any, any, any>[];
  activeConnector: Connector<any, any, any> | undefined;
  username: string;
  login: ((connector: Connector) => Promise<void>) | undefined;
  logout: (() => Promise<void>) | undefined;
}

export const AuthenticationContext = createContext<IAuthenticationContext>({
  isConnected: false,
  isConnecting: false,
  isAppUsername: false,
  connectors: [],
  activeConnector: undefined,
  username: "undefined",
  login: undefined,
  logout: undefined,
});

export const useAuthentication = (): IAuthenticationContext => {
  return useContext(AuthenticationContext);
};

const AuthenticationProvider = ({
  children,
}: //   session,
{
  children: ReactNode;
  //   session: Session | null;
}) => {
  const { setIsConnectOptionsOpened, setIsDeployingAccount } = useAppStates();
  //   const { setIsPingLogoutSessionExpiry } = useNotifications();
  const addressAppDeploy = env.NEXT_PUBLIC_ENABLE_TESTNETS
    ? NETWORK_CONFIGS[polygonMumbai.id]?.addrAppDeploy
    : NETWORK_CONFIGS[polygon.id]?.addrAppDeploy; // TODO: make NEXT_PUBLIC_ENABLE_TESTNETS true in preview, false in prod to enable mainnet
  const { data, status } = useSession(); // from data, can get id (address) from server side
  useEffect(() => {
    console.log("SESSION UPDATED:", data?.expires);
  }, [data?.expires]);
  const {
    address: addressWallet,
    connector: activeConnector,
    isConnected: isAddressConnected,
    isConnecting: isAddressConnecting,
    isReconnecting: isAddressReconnecting,
  } = useAccount({
    // eslint-disable-next-line
    onDisconnect: async () => {
      // For security reasons we sign out the user when a wallet disconnects.
      await logout();
    },
  });

  const { signMessageAsync } = useSignMessage();

  const authIn = async (address: Address, chainId: number) => {
    try {
      const message = new SiweMessage({
        version: "1",
        address: address,
        chainId: chainId,
        nonce: await getCsrfToken(),
        statement: "Sign In With Ethereum.",
        domain: window.location.host,
        uri: window.location.origin,
      });
      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({
        message: preparedMessage,
      });
      await signIn("credentials", {
        message: JSON.stringify(message),
        redirect: false,
        signature,
        // callbackUrl,
      });
      log.info("authIn - success", { address: address });
    } catch (error) {
      console.error("Failed to auth in");
      console.error(error);
      log.info("authIn - failure", { address: address });
    }
  };

  const authOut = async () => {
    if (status === "unauthenticated") return;
    try {
      await signOut({ redirect: false }); // callbackUrl: ROUTE_HOME
    } catch (error) {
      console.error("Failed to auth out");
      console.error(error);
    }
  };

  const [isProcessingLogin, setIsProcessingLogin] = useState<boolean>(false);
  const { connectAsync, connectors } = useConnect({
    onSuccess: async (data) => {
      setIsProcessingLogin(true);

      const isDeployed = await readContract({
        address: addressAppDeploy!,
        abi: ["function isDeployed(address _user) public view returns (bool)"],
        functionName: "isDeployed",
        args: [data.account],
      });

      if (!isDeployed) {
        try {
          const config = await prepareWriteContract({
            address: addressAppDeploy!,
            abi: ["function deploy() external"],
            functionName: "deploy",
          });
          const { wait } = await writeContract(config); // TODO: watch out for https://github.com/spruceid/siwe/pull/153
          setIsDeployingAccount(true);
          await wait();
          console.warn("ACCOUNT DEPLOYED");
          log.info("deploy account - success", { address: data.account });

          await authIn(data.account, data.chain.id);
        } catch (error) {
          console.error(error);
          log.error("deploy account - failure", { address: data.account });
        }
      } else {
        await authIn(data.account, data.chain.id);
      }

      console.log("SIGNIN COMPLETE");
      setIsConnectOptionsOpened(false);
      setIsDeployingAccount(false);
      setIsProcessingLogin(false);
    },
  });
  const { disconnectAsync } = useDisconnect({
    onSuccess: async () => {
      await authOut();
      console.log("SIGNOUT COMPLETE");
    },
  });

  const login = async (connector: Connector) => {
    if (addressAppDeploy === undefined) return;
    try {
      log.info("login - attempt");
      await connectAsync({ connector });
    } catch (error) {
      log.error("login - failure");
      console.error(error);
    }
  };
  const logout = useCallback(async () => {
    try {
      await disconnectAsync();
    } catch (error) {
      console.error(error);
    }
  }, [disconnectAsync]);

  const isConnecting =
    isAddressConnecting ||
    isAddressReconnecting ||
    status === "loading" ||
    isProcessingLogin ||
    addressAppDeploy === undefined;
  const isConnected = isAddressConnected && status === "authenticated";

  //   const isSessionExpired =
  //     data === null ||
  //     Date.now() > Date.parse(data?.expires) ||
  //     isNaN(Date.parse(data?.expires));
  //   const isTriggerLogout = isSessionExpired && addressWallet !== undefined;
  //   const [isTriggerLogout_] = useDebouncedValue(isTriggerLogout, 1000 * 3);
  //   useEffect(() => {
  //     const logout_ = async () => {
  //       if (!isConnecting && isTriggerLogout_) {
  //         await logout();
  //         setIsPingLogoutSessionExpiry(true);
  //       }
  //     };
  //    void logout_();
  //   }, [isConnecting, isTriggerLogout_, logout, setIsPingLogoutSessionExpiry]); // TODO: its not working

  const { data: usernameApp } = api.profile.getOwnProfile.useQuery(undefined, {
    refetchInterval: 1_000 * 60 * 60 * 1, // millisecond
    refetchIntervalInBackground: false,
    select: (data) => {
      if (data === null || data === undefined) return undefined;
      return data.username;
    },
  });

  const isAppUsername = usernameApp !== undefined;
  const username =
    usernameApp ??
    (addressWallet ? truncateEthAddress(addressWallet) : "unknown");

  // useEffect(()=>{
  //     const loginOnMount = async ()=>{
  //         await login()
  //     }
  // },[])
  useAddressMismatch({ callback: logout });

  // ENHANCE: when applicable, do logout on account/network change | ref: https://github.com/family/connectkit/blob/main/packages/connectkit/src/siwe/SIWEProvider.tsx#L24

  const contextProvider = {
    isConnected,
    isConnecting,
    isAppUsername,
    connectors,
    activeConnector,
    username,
    login,
    logout,
  };

  return (
    <AuthenticationContext.Provider value={contextProvider}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationProvider;
// TODO: currently session remains even after page/tab closes/refresh - only way is to make session "expire" from server-side
