import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getTopPlayers, updatePlayerScore, getPlayerRank, getDb } from "./db";
import { leaderboard } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const leaderboardRouter = router({
  // Submit player score
  submitScore: protectedProcedure
    .input(z.object({ score: z.number().min(0) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await updatePlayerScore(ctx.user.id, ctx.user.name || "Player", input.score);
        return { success: true };
      } catch (error) {
        console.error("Failed to submit score:", error);
        throw error;
      }
    }),

  // Get top 10 players
  getTopPlayers: publicProcedure.query(async () => {
  try {
    const topPlayers = await getTopPlayers(10);
    
    // Convert to proper format
    return topPlayers.map((p, index) => ({
      rank: index + 1,
      username: p.username || "Anonymous",
      highScore: p.highScore || 0,
    }));
  } catch (error) {
    console.error("Failed to get top players:", error);
    return [];
  }

}),

  // Get player's rank
  getPlayerRank: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    try {
      const rank = await getPlayerRank(ctx.user.id);
      return { rank: rank || null };
    } catch (error) {
      console.error("Failed to get player rank:", error);
      return { rank: null };
    }
  }),

  // Get leaderboard stats
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalPlayers: 0, totalCoins: 0, highestScore: 0 };

    try {
      const stats = await db.select().from(leaderboard);
      return {
        totalPlayers: stats.length,
        totalCoins: stats.reduce((sum, p) => sum + p.highScore, 0),
        highestScore: stats.length > 0 ? Math.max(...stats.map(p => p.highScore)) : 0,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return { totalPlayers: 0, totalCoins: 0, highestScore: 0 };
    }
  }),

  // Save game data (for cross-device sync)
  saveGameData: protectedProcedure
    .input(
      z.object({
        coins: z.number(),
        chips: z.number(),
        clickCount: z.number(),
        upgrades: z.string(),
        activeCosmetics: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Store game data in a game_data table (you'll need to add this to schema)
        // For now, we'll just update the leaderboard with coins
        await updatePlayerScore(ctx.user.id, ctx.user.name || "Player", input.coins);
        return { success: true };
      } catch (error) {
        console.error("Failed to save game data:", error);
        throw error;
      }
    }),

  // Get user's game data (for cross-device sync)
  getUserData: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");

    const db = await getDb();
    if (!db) return null;

    try {
      const playerData = await db
        .select()
        .from(leaderboard)
        .where(eq(leaderboard.userId, ctx.user.id))
        .limit(1);

      if (playerData.length === 0) return null;

      return {
        coins: playerData[0].highScore,
        chips: 0,
        clickCount: 0,
        upgrades: "{}",
        activeCosmetics: "{}",
      };
    } catch (error) {
      console.error("Failed to get user data:", error);
      return null;
    }
  }),
});
