import { TRPCError } from "@trpc/server";

import { z } from "zod";
import { prisma } from "~/server/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import { onlyValidAddress } from "~/server/utils";

import { type Profiles } from "@prisma/client";
import { type Address } from "wagmi";

export const followRouter = createTRPCRouter({
  follow: protectedProcedure
    .input(
      z.object({
        addressFollowee: onlyValidAddress,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const address = ctx.session?.user.id;
      const addressFollowee = input.addressFollowee;

      // verify `username` exists for follower (caller)
      let profileFollower: Profiles | null;
      try {
        profileFollower = await ctx.prisma.profiles.findUnique({
          where: {
            address: address,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `error checking username (follower) - ${address}`,
        });
      }
      if (profileFollower === null) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `no username (follower) - ${address}`,
        });
      }

      // verify `username` exists for followee (broadcaster)
      let profileFollowee: Profiles | null;
      try {
        profileFollowee = await ctx.prisma.profiles.findUnique({
          where: {
            address: addressFollowee,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `error checking username (followee) - ${address}`,
        });
      }
      if (profileFollowee === null) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `no username (followee) - ${address}`,
        });
      }

      // follow
      try {
        await ctx.prisma.follows.create({
          data: {
            follower: address,
            followee: addressFollowee,
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `error following - ${address}`,
        });
      }
    }),
  unfollow: protectedProcedure
    .input(
      z.object({
        addressFollowee: onlyValidAddress,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const address = ctx.session?.user.id;
      const addressFollowee = input.addressFollowee;

      try {
        await ctx.prisma.follows.delete({
          where: {
            follower_followee: {
              follower: address,
              followee: addressFollowee,
            },
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `error unfollowing - ${address}`,
        });
      }
    }),
  //   following: protectedProcedure.query(async ({ ctx }) => {
  //     const address = getCallerAddress(ctx);
  //     let data: { followee: string }[];
  //     try {
  //       data = await getFollowing(address);
  //     } catch (error: any) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: `error listing followings - ${address}`,
  //       });
  //     }
  //     return data;
  //     // ENHANCE: to some sort of pagination to make more efficient
  //   }),
});

// TODO: add axiom logs directly to api route flows - add for ALL apis

export const getFollowees = async (address: Address) => {
  const followees = await prisma.follows.findMany({
    where: {
      follower: address,
    },
    select: {
      followee: true,
    },
    orderBy: {
      followee: "asc",
    },
  });
  return followees.map((a) => a.followee as Address);
};
