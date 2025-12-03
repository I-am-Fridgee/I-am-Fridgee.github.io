import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPlayerRank, getTopPlayers, updatePlayerScore } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leaderboard: router({
    getTop: publicProcedure.query(async () => {
      return await getTopPlayers(10);
    }),
    submitScore: protectedProcedure
      .input(z.object({ score: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
        const username = ctx.user.name || ctx.user.email || "Anonymous";
        await updatePlayerScore(ctx.user.id, username, input.score);
        const rank = await getPlayerRank(ctx.user.id);
        return { success: true, rank };
      }),
    getMyRank: protectedProcedure.query(async ({ ctx }) => {
      return await getPlayerRank(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
