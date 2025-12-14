

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./firebase-admin";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
console.log("🔥 firebase-leaderboard.ts LOADED - Firestore version active");

export const firebaseLeaderboardRouter = router({

  // Submit or update player score
  submitScore: protectedProcedure
    .input(z.object({ 
      score: z.number().min(0),
      username: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const userId = ctx.user.id.toString();
      const userRef = db.collection('leaderboard').doc(userId);
      
      try {
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          // New player - create document
          await userRef.set({
            userId: ctx.user.id,
            username: input.username || ctx.user.name || "Player",
            highScore: input.score,
            coins: input.score,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp()
          });
        } else {
          const currentData = userDoc.data();
          // Update only if new score is higher
          if (input.score > (currentData?.highScore || 0)) {
            await userRef.update({
              highScore: input.score,
              coins: input.score,
              username: input.username || currentData?.username,
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        }
        
        return { success: true, message: "Score submitted!" };
      } catch (error) {
        console.error("Firestore submitScore error:", error);
        throw new Error("Failed to save score");
      }
    }),

  // Get top 10 players
  getTopPlayers: publicProcedure
    .query(async () => {
      try {
        const snapshot = await db.collection('leaderboard')
          .orderBy('highScore', 'desc')
          .limit(10)
          .get();
        
        if (snapshot.empty) {
          return [];
        }
        
        return snapshot.docs.map((doc, index) => {
          const data = doc.data();
          return {
            rank: index + 1,
            username: data.username || "Anonymous",
            highScore: data.highScore || 0,
            userId: data.userId
          };
        });
      } catch (error) {
        console.error("Firestore getTopPlayers error:", error);
        return [];
      }
    }),

  // Get player's rank
  getPlayerRank: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) return { rank: null };
      
      try {
        const snapshot = await db.collection('leaderboard')
          .orderBy('highScore', 'desc')
          .get();
        
        const userIndex = snapshot.docs.findIndex(doc => 
          doc.data().userId === ctx.user?.id
        );
        
        return { rank: userIndex >= 0 ? userIndex + 1 : null };
      } catch (error) {
        console.error("Firestore getPlayerRank error:", error);
        return { rank: null };
      }
    }),

  // Get leaderboard stats (total players, highest score, etc.)
  getStats: publicProcedure
    .query(async () => {
      try {
        const snapshot = await db.collection('leaderboard').get();
        
        if (snapshot.empty) {
          return { totalPlayers: 0, highestScore: 0, totalCoins: 0 };
        }
        
        let highestScore = 0;
        let totalCoins = 0;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.highScore > highestScore) highestScore = data.highScore;
          totalCoins += data.coins || 0;
        });
        
        return {
          totalPlayers: snapshot.size,
          highestScore,
          totalCoins
        };
      } catch (error) {
        console.error("Firestore getStats error:", error);
        return { totalPlayers: 0, highestScore: 0, totalCoins: 0 };
      }
    }),

  // Admin: Give coins to any player
  giveCoins: protectedProcedure
    .input(z.object({
      userId: z.string(),
      amount: z.number().min(1).max(1000000)
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error("Admin access required");
      }
      
      try {
        const userRef = db.collection('leaderboard').doc(input.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          throw new Error("Player not found in leaderboard");
        }
        
        await userRef.update({
          coins: FieldValue.increment(input.amount),
          highScore: FieldValue.increment(input.amount),
          updatedAt: FieldValue.serverTimestamp()
        });
        
        return { 
          success: true, 
          message: `Added ${input.amount} coins to player` 
        };
      } catch (error) {
        console.error("Firestore giveCoins error:", error);
        throw error;
      }
    }),


  // Admin: Get all players (for admin panel)
  getAllPlayers: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error("Admin access required");
      }
      
      try {
        const snapshot = await db.collection('leaderboard')
          .orderBy('highScore', 'desc')
          .get();
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            highScore: data.highScore,
            coins: data.coins,
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        });
      } catch (error) {
        console.error("Firestore getAllPlayers error:", error);
        return [];
      }
    })
});

 
});
