import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { ethers } from "ethers";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

import { env } from "~/env.mjs";

import { onlyValidAddress, getWeb3Provider } from "~/server/utils";
import { LIVEKIT_TTL_SECONDS } from "~/constants/common";

const LIVEKIT_HOST_URL = env.NEXT_PUBLIC_LIVEKIT_SERVER_URL;
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET;

const service = new RoomServiceClient(
  `http://${LIVEKIT_HOST_URL}`,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

export const viewerRouter = createTRPCRouter({
  fetchTokenViewer: protectedProcedure
    .input(
      z.object({
        chainId: z.number().int().lte(9999999), // ENHANCE: set tuple only supported chainIds, eg: (chainId in [...list of supported chainIds])
        addressApp: onlyValidAddress,
        addressBroadcaster: onlyValidAddress,
        name: z.string(), // TODO: put length limit here
      })
    )
    .mutation(async ({ input, ctx }) => {
      const address = ctx.session?.user.id;

      let token: string;
      try {
        // const data = await readContract({
        //   address: input.addressApp,
        //   abi: [
        //     "function isViewSessionAllowed(address _viewer, address _broadcaster) external view returns (bool)",
        //   ],
        //   functionName: "isViewSessionAllowed",
        //   args: [address, input.addressBroadcaster],
        //   chainId: input.chainId,
        // });
        // const isViewSessionAllowed = data as boolean;
        // if (!isViewSessionAllowed) {
        //   throw new TRPCError({
        //     code: "FORBIDDEN",
        //     message: `Not allowed to view session`,
        //   });
        // } // TODO: this call may fail as blockchain haven't update yet...

        const provider = getWeb3Provider(input.chainId);
        const contract = new ethers.Contract(
          input.addressApp,
          [
            "function isViewSessionAllowed(address _viewer, address _broadcaster) external view returns (bool)",
          ],
          provider
        );
        // eslint-disable-next-line
        const isViewSessionAllowed = await contract.isViewSessionAllowed(
          address,
          input.addressBroadcaster
        );
        if (!isViewSessionAllowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Not allowed to view session`,
          });
        }

        const accessToken = new AccessToken(
          LIVEKIT_API_KEY,
          LIVEKIT_API_SECRET,
          {
            ttl: LIVEKIT_TTL_SECONDS,
            name: input.name,
            identity: address,
          }
        );
        accessToken.addGrant({
          roomJoin: true,
          room: input.addressBroadcaster,
          canPublish: false,
          canPublishData: true,
          canSubscribe: true,
          hidden: false,
          recorder: false,
        });
        token = accessToken.toJwt();
        ctx.log.info("api - viewer token - success", { address: address });
      } catch (error) {
        ctx.log.error("api - viewer token - failure", {
          address: address,
          reason: error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${JSON.stringify(error)}`,
        });
      }

      return token;
    }),
  getSession: protectedProcedure
    .input(
      z.object({
        addressBroadcaster: onlyValidAddress,
      })
    )
    .query(async ({ input, ctx }) => {
      let data;
      try {
        data = await ctx.prisma.sessions.findUnique({
          where: {
            address: input.addressBroadcaster,
          },
          select: {
            name: true,
            title: true,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${JSON.stringify(error)}`,
        });
      }

      return data;
    }),
});
