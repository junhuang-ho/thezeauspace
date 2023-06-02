import { mainnet, polygon, polygonMumbai } from "wagmi/chains";
import { type Address } from "wagmi";
import { ethers } from "ethers";
import { z } from "zod";

export const WALLET_CONNECT_ID = "5abe71d647514f366ddc98f3124f0d02";

export const FLOW_POOL_URL = "https://pool.zeau.space";
export const APP_NAME = "zeau";
export const ZERO_STRING = "0";
export const ZERO_BIG_NUMBER = ethers.utils.parseEther(ZERO_STRING);
export const PING_INTERVAL_SECONDS = 60 * 2;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_REFETCH_INTERVAL = SESSION_MAX_AGE_SECONDS - 60 * 60; // 1 hr less
export const LIVEKIT_TTL_SECONDS = 900;
export const MIN_LENGTH_USERNAME = 2;
export const MAX_LENGTH_USERNAME = 15;
export const MIN_LENGTH_TITLE = 1;
export const MAX_LENGTH_TITLE = 200;
export const TRUNCATE_REGEX =
  /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;
export const REGEX_USERNAME_1 = /^([a-z0-9.]){2,15}$/;
export const REGEX_USERNAME_2 = /admin/;
export const REGEX_USERNAME_3 = /zeau/;
export const MiB_IN_BYTES = 1048576;

export const BUCKET_1 = "livethree-1";
export const BUCKET_IMAGE_1 = "profile_pic";
export const BUCKET_IMAGE_1_DEV = "profile_pic_dev";
export const GCP_IMAGE_BASE_PATH_PUBLIC = `https://storage.googleapis.com/${BUCKET_1}`;

export const ROUTE_HOME = "/";
export const ROUTE_EXPLORE = "/explore";
export const ROUTE_STUDIO = "/studio";
export const ROUTE_PROFILE = "/profile";
export const ROUTE_TRANSFER = "/transfer";
export const ROUTE_WITHDRAW = "/withdraw";

const rates = ["Second", "Minute", "Hour"] as const;
export const Rates = z.enum(rates);
export type RatesType = z.infer<typeof Rates>;

// useful links: https://bundlephobia.com/

export const ADDRESS_GELATO_FEE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ADDRESS_ZERODEV_BATCH =
  "0x8ae01fCF7c655655fF2c6Ef907b8B4718Ab4e17c";

export const NETWORK_CONFIG_DEFAULT: NETWORK_CONFIG = {
  addrApp: "0xB5FBeF5f93144d1Fb8d32479dEB6018822043367", // TODO: thsi is TMP !! replace with real one !!!
  addrAppDeploy: "0x8c5dCA45b16E0c73b5bE0fc877E7d9Fda70d40b5", // TODO: thsi is TMP !! replace with real one !!!
  addrUSDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
  addrUSDCx: "0xCAa7349CEA390F89641fe306D93591f87595dc1F",
  addrSFHost: "0x3E14dC1b13c488a8d5D310918780c983bD5982E7",
  addrSFCFAV1: "0x6EeE6060f715257b970700bc2656De21dEdF074C",
  addrGelOps: "0x527a819db1eb0e34426297b03bae11F2f8B3A19E", // automation contract
  addrGelTreasury: "0x32DC6700AC87f6300277a63b0A4fDf132A8392bd",
  subgraphURLSF:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic",
  alchemyNameHelper: "polygon-mainnet",
};
export const NETWORK_CONFIGS: { [x: number]: NETWORK_CONFIG } = {
  [polygon.id]: NETWORK_CONFIG_DEFAULT,
  [polygonMumbai.id]: {
    addrApp: "0xB5FBeF5f93144d1Fb8d32479dEB6018822043367",
    addrAppDeploy: "0x8c5dCA45b16E0c73b5bE0fc877E7d9Fda70d40b5",
    addrUSDC: "0xbe49ac1EadAc65dccf204D4Df81d650B50122aB2",
    addrUSDCx: "0x42bb40bF79730451B11f6De1CbA222F17b87Afd7",
    addrSFHost: "0xEB796bdb90fFA0f28255275e16936D25d3418603",
    addrSFCFAV1: "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873",
    addrGelOps: "0xB3f5503f93d5Ef84b06993a1975B9D21B962892F", // automation contract
    addrGelTreasury: "0x527a819db1eb0e34426297b03bae11F2f8B3A19E",
    subgraphURLSF:
      "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai",
    alchemyNameHelper: "polygon-mumbai",
  },
  //   [mainnet.id]: {
  //     addrApp: "0x...",
  //     addrUSDC: "0x...",
  //     addrUSDCx: "0x...",
  //     addrSFHost: "0x...",
  //     addrSFCFAV1: "0x...",
  //     addrGelOps: "0x...", // automation contract
  //     addrGelTreasury: "0x...",
  //     subgraphURLSF:
  //       "https://subgraph.satsuma-prod.com/c5br3jaVlJI6/superfluid/eth-mainnet/api",
  //     alchemyNameHelper: "eth-mainnet",
  //   },
};

export const CHARACTERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "_",
];

// types/interfaces

export type NETWORK_CONFIG = {
  addrApp: Address;
  addrAppDeploy: Address;
  addrUSDC: Address;
  addrUSDCx: Address;
  addrSFHost: Address;
  addrSFCFAV1: Address;
  addrGelOps: Address;
  addrGelTreasury: Address;
  subgraphURLSF: string;
  alchemyNameHelper: string;
};
export type Quality = "720p" | "1080p";
