// Create a new file: admin.ts

import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, leaderboard, gameData } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

export const adminRouter = router({
  // Check if user is admin
  checkAdmin: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return ctx.user.role === "admin" || ctx.user.role === "moderator";
  }),

  // Get all users (admin only)
  getAllUsers: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) return [];

      try {
        const allUsers = await db
          .select({
            id: users.id,
            openId: users.openId,
            name: users.name,
            email: users.email,
            role: users.role,
            createdAt: users.createdAt,
            lastSignedIn: users.lastSignedIn,
          })
          .from(users)
          .orderBy(desc(users.createdAt));

        return allUsers;
      } catch (error) {
        console.error("Failed to get all users:", error);
        throw error;
      }
    }),

  // Update user role
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "moderator"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db
          .update(users)
          .set({ role: input.role })
          .where(eq(users.id, input.userId));

        return { success: true };
      } catch (error) {
        console.error("Failed to update user role:", error);
        throw error;
      }
    }),

  // Give coins to player
  giveCoins: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().min(1).max(1000000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get current game data
        const currentData = await db
          .select()
          .from(gameData)
          .where(eq(gameData.userId, input.userId))
          .limit(1);

        if (currentData.length > 0) {
          // Update existing
          await db
            .update(gameData)
            .set({
              coins: currentData[0].coins + input.amount,
              lastSynced: new Date(),
            })
            .where(eq(gameData.userId, input.userId));
        } else {
          // Create new entry
          await db.insert(gameData).values({
            userId: input.userId,
            coins: input.amount,
            chips: 0,
            clickCount: 0,
            upgrades: "{}",
            activeCosmetics: "{}",
          });
        }

        // Also update leaderboard
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (user.length > 0) {
          await db
            .update(leaderboard)
            .set({ highScore: input.amount })
            .where(eq(leaderboard.userId, input.userId));
        }

        return { success: true };
      } catch (error) {
        console.error("Failed to give coins:", error);
        throw error;
      }
    }),

  // Remove player from leaderboard
  removeFromLeaderboard: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db
          .delete(leaderboard)
          .where(eq(leaderboard.userId, input.userId));

        return { success: true };
      } catch (error) {
        console.error("Failed to remove from leaderboard:", error);
        throw error;
      }
    }),

  // Reset user cookies/data (simulate)
  resetUserData: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Reset game data
        await db
          .update(gameData)
          .set({
            coins: 0,
            chips: 0,
            clickCount: 0,
            upgrades: "{}",
            activeCosmetics: "{}",
            lastSynced: new Date(),
          })
          .where(eq(gameData.userId, input.userId));

        // Remove from leaderboard
        await db
          .delete(leaderboard)
          .where(eq(leaderboard.userId, input.userId));

        return { success: true };
      } catch (error) {
        console.error("Failed to reset user data:", error);
        throw error;
      }
    }),
});
