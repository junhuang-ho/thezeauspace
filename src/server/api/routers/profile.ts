import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { type Address } from "wagmi";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

import { prisma } from "~/server/db";
import { onlyValidAddress, rateLimit, getPUTURLImage } from "~/server/utils";
import { getFollowees } from "./follow";

import { type Profiles } from "@prisma/client";

import { OnlyValidUsername } from "~/utils/common";

const MAX_REQUESTS_PER_INTERVAL_1 = 5; // interval input value for rateLimit fn
const limiter1 = rateLimit({
  interval: 1_000 * 5, //60 * 1, // 1_000 * 60 * 60 * 24 * 1, // milliseconds * seconds * minutes * hours * days
  uniqueTokenPerInterval: 1_000, // max users per second
});

// const MAX_REQUESTS_PER_INTERVAL_2 = 3; // interval input value for rateLimit fn
// const limiter2 = rateLimit({
//   interval: 1_000 * 60 * 60 * 24 * 1, // milliseconds * seconds * minutes * hours * days
//   uniqueTokenPerInterval: 1_000, // max users per second
// });

export const profileRouter = createTRPCRouter({
  getOwnProfile: protectedProcedure.query(async ({ ctx }) => {
    const address = ctx.session?.user.id;

    const profile = await getProfileByAddress(address);

    return profile;
  }),
  getOtherProfile: publicProcedure
    .input(
      z.object({
        addressOther: onlyValidAddress,
      })
    )
    .mutation(async ({ input }) => {
      const profile = await getProfileByAddress(input.addressOther);

      return profile;
    }),
  getAddressByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      let profile: ProfileWithoutUsername | null;
      try {
        profile = await getProfileByUsername(input.username);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "error fetching profile",
        });
      }
      return profile === null ? null : (profile.address as Address);
    }),
  getFollowingProfiles: protectedProcedure.query(async ({ ctx }) => {
    const address = ctx.session?.user.id;

    let followees: Address[];
    try {
      followees = await getFollowees(address);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `error listing followings - ${address}`,
      });
    }

    let profiles: Profiles[];
    try {
      profiles = await ctx.prisma.profiles.findMany({
        where: {
          address: { in: followees },
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `error fetching profiles - ${address}`,
      });
    }

    return profiles;
  }),
  setUsername: protectedProcedure
    .input(
      z.object({
        username: OnlyValidUsername, // TODO: test
        // isGetImageUrl: z.boolean(),
        isUpdate: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const address = ctx.session?.user.id;

      try {
        await limiter1.check(
          ctx.res,
          MAX_REQUESTS_PER_INTERVAL_1,
          "CACHE_TOKEN"
        );
      } catch (error) {
        return {
          success: false,
          reason: "rate limited",
          putUrlImage: null,
        };
      } // ENHANCE: implement rate limiter when have more users
      // TODO: test rate limiter as has new implementation

      const username = input.username;

      // check if username exists
      let profile: ProfileWithoutUsername | null;
      try {
        profile = await getProfileByUsername(username);
      } catch (error) {
        return {
          success: false,
          reason: "error checking if username unique or not",
          putUrlImage: null,
        };
      }

      if (profile !== null)
        return {
          success: false,
          reason: "username already exists",
          putUrlImage: null,
        };

      // set username
      try {
        if (input.isUpdate) {
          await ctx.prisma.profiles.update({
            where: { address: address },
            data: { username: username },
          });
        } else {
          await ctx.prisma.profiles.create({
            data: {
              address: address,
              username: username,
            },
          });
        }

        // let putUrlImage;
        // if (input.isGetImageUrl) {
        //   putUrlImage = await getPUTURLImage(address);
        // } else {
        //   putUrlImage = null;
        // }

        return {
          success: true,
          reason: "username set success",
          //   putUrlImage: putUrlImage,
        };
      } catch (error) {
        return {
          success: false,
          reason: "error setting username",
          //   putUrlImage: null,
        };
      }
    }),
  fetchPUTURLImage: protectedProcedure.mutation(async ({ ctx }) => {
    const address = ctx.session?.user.id;

    // try {
    //   await limiter2.check(ctx.res, MAX_REQUESTS_PER_INTERVAL_2, "CACHE_TOKEN");
    // } catch (error: any) {
    //   return "rate limited";
    // } // ENHANCE: implement rate limiter when have more users

    return await getPUTURLImage(address);
  }),
});

type ProfileWithoutAddress = {
  username: string;
};
const getProfileByAddress = async (address: Address) => {
  const profile = await prisma.profiles.findUnique({
    where: {
      address: address,
    },
    select: {
      username: true,
    },
  });
  return profile;
};

type ProfileWithoutUsername = {
  address: string;
};
const getProfileByUsername = async (username: string) => {
  const profile = await prisma.profiles.findUnique({
    where: {
      username: username,
    },
    select: {
      address: true,
    },
  });
  return profile;
};
