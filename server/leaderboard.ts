import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as db from "../db";
import { leaderboard } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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
      const userId = ctx.user.id;
      const username = input.username || ctx.user.name || "Anonymous";

      try {
        // Get existing leaderboard entry
        const existingEntry = await db.db
          .select()
          .from(leaderboard)
          .where(eq(leaderboard.userId, userId))
          .limit(1);

        if (existingEntry.length > 0) {
          // Update if new score is higher
          if (input.score > existingEntry[0].highScore) {
            await db.db
              .update(leaderboard)
              .set({
                highScore: input.score,
                username: username,
                updatedAt: new Date(),
              })
              .where(eq(leaderboard.userId, userId));
          }
        } else {
          // Create new entry
          await db.db.insert(leaderboard).values({
            userId: userId,
            username: username,
            highScore: input.score,
          });
        }

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
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      try {
        const topPlayers = await db.db
          .select()
          .from(leaderboard)
          .orderBy(desc(leaderboard.highScore))
          .limit(input.limit)
          .offset(input.offset);

        return topPlayers.map((entry, index) => ({
          rank: input.offset + index + 1,
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
      try {
        const userId = ctx.user.id;

        // Get player's entry
        const playerEntry = await db.db
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

        // Count how many players have higher scores
        const higherScores = await db.db
          .select()
          .from(leaderboard)
          .where((col) => col.highScore > playerEntry[0].highScore);

        const rank = higherScores.length + 1;

        return {
          rank: rank,
          score: playerEntry[0].highScore,
          username: playerEntry[0].username,
          totalPlayers: await db.db.select().from(leaderboard),
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
        const allEntries = await db.db.select().from(leaderboard);

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
