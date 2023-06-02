import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const testRouter = createTRPCRouter({
  //   addressTestPublic: publicProcedure.query(({ ctx }) => {
  //     return ctx.session?.user.id;
  //   }),
  addressTestProtected: protectedProcedure.query(({ ctx }) => {
    return ctx.session?.user.id;
  }), // NOTE: don't delete, used in prod
  //   loggerTestPublic: publicProcedure.mutation(({ ctx }) => {
  //     ctx.log.info("SERVER - public");
  //     console.log("SERVER - public - normal log"); // this works in axiom as well
  //   }),
  //   loggerTestPrivate: protectedProcedure.mutation(({ ctx }) => {
  //     ctx.log.info("SERVER - protected");
  //     console.log("SERVER - protected - normal log"); // this works in axiom as well
  //   }),
});
