import { type NextApiResponse } from "next";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ethers } from "ethers";
import { type Address } from "wagmi";
import { NETWORK_CONFIGS, BUCKET_1 } from "~/constants/common";
import { env } from "~/env.mjs";

import { LRUCache } from "lru-cache";
import { Storage } from "@google-cloud/storage";
import { getGCPImageFolderName } from "~/utils/common";

export const getVerifiedAddress = (address: string | null | undefined) => {
  if (!address || !ethers.utils.isAddress(address)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid address: ${JSON.stringify(address)}`,
    });
  }
  return address;
};

export const onlyValidAddress = z.custom<Address>((val) => {
  return getVerifiedAddress(val as string);
});

export const getDatetimeNSecondsAgo = (n: number) => {
  const dt = new Date();
  dt.setSeconds(dt.getSeconds() - n);
  return dt;
};

export const getAlchemyHttpUrl = (network: string): string => {
  // , apiKey: string
  return `https://${network}.g.alchemy.com/v2/`; // ${apiKey}
};

export const getWeb3Provider = (chainId: number) => {
  const networkName = NETWORK_CONFIGS[chainId]?.alchemyNameHelper;

  if (!networkName) return;

  const rpcUrl = getAlchemyHttpUrl(networkName);

  const provider = new ethers.providers.StaticJsonRpcProvider(
    `${rpcUrl}${env.NEXT_PUBLIC_ALCHEMY_API_KEY_CLIENT}`
  );

  return provider;
};

export const getFormattedGCPPrivateKey = (key: string) => {
  return key.replace(/\\n/g, "\n"); // ref: https://stackoverflow.com/a/41044630
};

export const initGCPStorage = () => {
  return new Storage({
    projectId: env.GCP_PROJECT_ID,
    credentials: {
      client_email: env.GCP_CLIENT_EMAIL,
      private_key: getFormattedGCPPrivateKey(env.GCP_PRIVATE_KEY),
    },
  }); // ref: https://github.com/leerob/nextjs-gcp-storage/blob/main/pages/api/upload-url.js
};

export const getGCPImagePath = (address: Address) => {
  const storage = initGCPStorage();
  const folderName = getGCPImageFolderName();
  const gcpFilePath = `${folderName}/${address}.jpeg`;
  const url = storage.bucket(BUCKET_1).file(gcpFilePath);

  return url;
};

export const getPUTURLImage = async (address: Address) => {
  const filePath = getGCPImagePath(address);
  const [putUrlImage] = await filePath.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 1000 * 30, // 30 seconds
    contentType: "image/jpeg", //"application/octet-stream",
  });

  return putUrlImage;
};

export const deleteImage = async (address: Address) => {
  const filePath = getGCPImagePath(address);
  try {
    await filePath.delete();
  } catch (error: any) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Error deleting image",
    });
  }
};

//   export const isImageExists = async (address: ADDRESS) => {
//     const filePath = getGCPImagePath(address);

//     const isExists = await filePath.exists();

//     return isExists;
//   };

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};
export const rateLimit = (options?: Options) => {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (res: NextApiResponse, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = (currentUsage ?? 0) > limit; // >=
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader(
          "X-RateLimit-Remaining",
          isRateLimited ? 0 : limit - (currentUsage ?? 0)
        );

        return isRateLimited ? reject() : resolve();
      }),
  };
}; // ref: https://github.com/vercel/next.js/tree/canary/examples/api-routes-rate-limit
