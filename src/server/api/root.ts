import { createTRPCRouter } from "~/server/api/trpc";
import { broadcasterRouter } from "./routers/broadcaster";
import { viewerRouter } from "./routers/viewer";
import { sessionRouter } from "./routers/session";
import { profileRouter } from "./routers/profile";
import { followRouter } from "./routers/follow";
import { testRouter } from "./routers/test";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  broadcaster: broadcasterRouter,
  viewer: viewerRouter,
  session: sessionRouter,
  profile: profileRouter,
  follow: followRouter,
  test: testRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
