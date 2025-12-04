import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getTopPlayers, updatePlayerScore, getPlayerRank, getDb } from "./db";
import { leaderboard } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

export const leaderboardRouter = router({
  /**
   * Submit or update a player's score
   * Requires Firebase authentication
   */
  submitScore: protectedProcedure
    .input(z.object({
      score: z.number().int().min(0),
      username: z.string().min(1).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      const userId = ctx.user.id;
      const username = input.username || ctx.user.name || "Anonymous";

      try {
        await updatePlayerScore(userId, username, input.score);
        return {
          success: true,
          score: input.score,
          message: "Score submitted successfully",
        };
      } catch (error) {
        console.error("[Leaderboard] Failed to submit score:", error);
        throw new Error("Failed to submit score");
      }
    }),

  /**
   * Get top players on the leaderboard
   * Public endpoint - no authentication required
   */
  getTopPlayers: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      try {
        const topPlayers = await getTopPlayers(input.limit);
        return topPlayers.map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          highScore: entry.highScore,
          updatedAt: entry.updatedAt,
        }));
      } catch (error) {
        console.error("[Leaderboard] Failed to get top players:", error);
        throw new Error("Failed to fetch leaderboard");
      }
    }),

  /**
   * Get current player's rank and score
   * Requires Firebase authentication
   */
  getPlayerRank: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      try {
        const userId = ctx.user.id;
        const rank = await getPlayerRank(userId);

        // Get player's score
        const db = await getDb();
        if (!db) {
          return {
            rank: null,
            score: 0,
            username: ctx.user.name || "Anonymous",
            message: "Database not available",
          };
        }

        const playerEntry = await db
          .select()
          .from(leaderboard)
          .where(eq(leaderboard.userId, userId))
          .limit(1);

        if (playerEntry.length === 0) {
          return {
            rank: null,
            score: 0,
            username: ctx.user.name || "Anonymous",
            message: "No score submitted yet",
          };
        }

        // Get total players for percentile
        const allPlayers = await db.select().from(leaderboard);

        return {
          rank: rank,
          score: playerEntry[0].highScore,
          username: playerEntry[0].username,
          totalPlayers: allPlayers.length,
        };
      } catch (error) {
        console.error("[Leaderboard] Failed to get player rank:", error);
        throw new Error("Failed to fetch player rank");
      }
    }),

  /**
   * Get leaderboard statistics
   * Public endpoint
   */
  getStats: publicProcedure
    .query(async () => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            totalPlayers: 0,
            highestScore: 0,
            averageScore: 0,
          };
        }

        const allEntries = await db.select().from(leaderboard);

        const totalPlayers = allEntries.length;
        const highestScore = allEntries.length > 0 
          ? Math.max(...allEntries.map(e => e.highScore))
          : 0;
        const averageScore = allEntries.length > 0
          ? Math.round(allEntries.reduce((sum, e) => sum + e.highScore, 0) / allEntries.length)
          : 0;

        return {
          totalPlayers,
          highestScore,
          averageScore,
        };
      } catch (error) {
        console.error("[Leaderboard] Failed to get stats:", error);
        throw new Error("Failed to fetch leaderboard stats");
      }
    }),
});
