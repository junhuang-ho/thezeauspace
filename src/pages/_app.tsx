import "~/styles/globals.css";
import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";

import { api } from "~/utils/api";

import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygon, polygonMumbai } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
// import { MetaMaskConnector } from "wagmi/connectors/metaMask";
// import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import {
  TwitterSocialWalletConnector,
  GoogleSocialWalletConnector,
  TwitchSocialWalletConnector,
  DiscordSocialWalletConnector,
  FacebookSocialWalletConnector,
} from "@zerodevapp/wagmi";

import { env } from "~/env.mjs";

import Hydration from "~/components/layouts/Hydration";
import MainLayout from "~/components/layouts/MainLayout";
import ThemeProvider from "~/contexts/Theme";
// import WalletProvider from "~/contexts/Wallet";
import AuthenticationProvider from "~/contexts/Authentication";
import AppStatesProvider from "~/contexts/AppStates";
import NotificationsProvider from "~/contexts/Notifications";

import { SESSION_REFETCH_INTERVAL } from "~/constants/common";

import { log } from "next-axiom";
if (process.env.NODE_ENV !== "production") log.logLevel = "off";

export { reportWebVitals } from "next-axiom";

const ZERODEV_PROJECT_ID = env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

const { chains, provider, webSocketProvider } = configureChains(
  [env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? polygonMumbai : polygon], // TODO: make NEXT_PUBLIC_ENABLE_TESTNETS true in preview, false in prod to enable mainnet
  [
    alchemyProvider({
      apiKey: env.NEXT_PUBLIC_ALCHEMY_API_KEY_CLIENT,
    }),
    publicProvider(),
  ]
);

const connectorGoogle = new GoogleSocialWalletConnector({
  chains,
  options: {
    projectId: ZERODEV_PROJECT_ID,
    shimDisconnect: true,
  },
});
const connectorTwitter = new TwitterSocialWalletConnector({
  chains,
  options: {
    projectId: ZERODEV_PROJECT_ID,
    shimDisconnect: true,
  },
});
const connectorTwitch = new TwitchSocialWalletConnector({
  chains,
  options: {
    projectId: ZERODEV_PROJECT_ID,
    shimDisconnect: true,
  },
});
const connectorDiscord = new DiscordSocialWalletConnector({
  chains,
  options: {
    projectId: ZERODEV_PROJECT_ID,
    shimDisconnect: true,
  },
});
const connectorFacebook = new FacebookSocialWalletConnector({
  chains,
  options: {
    projectId: ZERODEV_PROJECT_ID,
    shimDisconnect: true,
  },
});

const wagmiConfig = createClient({
  autoConnect: true, // TODO: verify with zerodev if works with social logins
  connectors: [
    connectorTwitter,
    connectorGoogle,
    connectorTwitch,
    connectorDiscord,
    connectorFacebook,
    // new MetaMaskConnector({ chains }),
    // new CoinbaseWalletConnector({ chains, options: { appName: "test" } }),
  ],
  provider,
  webSocketProvider,
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <Hydration>
      <ThemeProvider>
        <WagmiConfig client={wagmiConfig}>
          <SessionProvider
            session={session}
            refetchInterval={SESSION_REFETCH_INTERVAL}
            refetchOnWindowFocus={true}
          >
            <AppStatesProvider>
              <AuthenticationProvider>
                <NotificationsProvider>
                  <MainLayout>
                    <Component {...pageProps} />
                    <Analytics />
                  </MainLayout>
                </NotificationsProvider>
              </AuthenticationProvider>
            </AppStatesProvider>
          </SessionProvider>
        </WagmiConfig>
      </ThemeProvider>
    </Hydration>
  );
};

export default api.withTRPC(MyApp);
