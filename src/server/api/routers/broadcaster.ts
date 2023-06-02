import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import { env } from "~/env.mjs";

import {
  LIVEKIT_TTL_SECONDS,
  MIN_LENGTH_TITLE,
  MAX_LENGTH_TITLE,
} from "~/constants/common";

const LIVEKIT_HOST_URL = env.NEXT_PUBLIC_LIVEKIT_SERVER_URL;
const LIVEKIT_API_KEY = env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = env.LIVEKIT_API_SECRET;

const service = new RoomServiceClient(
  `http://${LIVEKIT_HOST_URL}`,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

export const broadcasterRouter = createTRPCRouter({
  createSession: protectedProcedure
    .input(
      z.object({
        name: z.string(), // TODO: put length limit here
        title: z.string().min(MIN_LENGTH_TITLE).max(MAX_LENGTH_TITLE),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const address = ctx.session?.user.id;

      //   try {
      //     await ctx.prisma.sessions.delete({
      //       where: {
      //         address: address,
      //       },
      //     });
      //   } catch (error: any) {
      //     throw new TRPCError({
      //       code: "INTERNAL_SERVER_ERROR",
      //       message: `${JSON.stringify(error)}`,
      //     });
      //   } // ENHANCE?: clear old session first

      let token: string;
      try {
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
          room: address,
          canPublish: true,
          canPublishData: true,
          canSubscribe: false,
          hidden: false,
          recorder: false,
        });
        token = accessToken.toJwt();

        await ctx.prisma.sessions.create({
          data: {
            address: address,
            name: input.name,
            title: input.title,
          },
        });
        ctx.log.info("api - session created - success", { address: address });
      } catch (error) {
        ctx.log.error("api - session created - failure", {
          address: address,
          reason: error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${JSON.stringify(error)}`,
        });
      }

      return { token: token };
    }),
  deleteSession: protectedProcedure.mutation(async ({ ctx }) => {
    const address = ctx.session?.user.id;

    try {
      await ctx.prisma.sessions.delete({
        where: {
          address: address,
        },
      });
      ctx.log.info("api - session deleted - success", { address: address });
    } catch (error) {
      ctx.log.error("api - session deleted - failure", {
        address: address,
        reason: error,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `${JSON.stringify(error)}`,
      });
    }
  }),
  pingDB: protectedProcedure.query(async ({ ctx }) => {
    const address = ctx.session?.user.id;

    try {
      await ctx.prisma.sessions.update({
        data: {
          lastPingedAt: new Date(),
        },
        where: {
          address: address,
        },
      });

      return true; // a return is required otherwise useQuery errors
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Unable to ping db - ${address}`,
      });
    }
  }),
});
