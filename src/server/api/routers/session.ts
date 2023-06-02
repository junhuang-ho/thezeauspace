import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

import { getDatetimeNSecondsAgo } from "~/server/utils";
import { PING_INTERVAL_SECONDS } from "~/constants/common";

export const sessionRouter = createTRPCRouter({
  getSessions: publicProcedure.query(async ({ ctx }) => {
    const datetime = getDatetimeNSecondsAgo(PING_INTERVAL_SECONDS + 5);

    let data;
    try {
      data = await ctx.prisma.sessions.findMany({
        take: 100, // get an extra item at the end which we'll use as next cursor (so don't have to skip 1)
        where: {
          lastPingedAt: {
            gt: datetime,
          },
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
