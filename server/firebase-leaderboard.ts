// firebase-leaderboard.ts (updated)
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { db } from "./firebase-admin";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

export const firebaseLeaderboardRouter = router({
  // Submit score with username and coins
  submitScore: protectedProcedure
    .input(z.object({ 
      score: z.number().min(0),
      username: z.string().min(1).max(50).optional(),
      coins: z.number().min(0).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const userId = ctx.user.id.toString();
      const leaderboardRef = db.collection('leaderboard').doc(userId);
      const userStatsRef = db.collection('userStats').doc(userId);
      
      try {
        // Update leaderboard (high scores)
        const leaderboardDoc = await leaderboardRef.get();
        const currentScore = leaderboardDoc.exists 
          ? (leaderboardDoc.data()?.highScore || 0)
          : 0;
        
        const newScore = Math.max(currentScore, input.score);
        
        await leaderboardRef.set({
          userId: ctx.user.id,
          username: input.username || ctx.user.name || "Player",
          highScore: newScore,
          lastPlayed: FieldValue.serverTimestamp(),
          ...(leaderboardDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp() })
        }, { merge: true });
        
        // Update user stats (coins, total clicks, etc.)
        const statsData = {
          coins: input.coins || FieldValue.increment(input.score || 0),
          totalClicks: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
          username: input.username || ctx.user.name || "Player"
        };
        
        await userStatsRef.set(statsData, { merge: true });
        
        return { 
          success: true, 
          message: "Score saved!",
          newHighScore: newScore > currentScore,
          rank: await getPlayerRank(userId)
        };
      } catch (error) {
        console.error("Firestore submitScore error:", error);
        throw new Error("Failed to save score");
      }
    }),
  
  // Get paginated leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      page: z.number().min(0).default(0)
    }))
    .query(async ({ input }) => {
      try {
        const offset = input.page * input.limit;
        
        // Get total count
        const countSnapshot = await db.collection('leaderboard').get();
        const totalPlayers = countSnapshot.size;
        
        // Get paginated results
        const snapshot = await db.collection('leaderboard')
          .orderBy('highScore', 'desc')
          .offset(offset)
          .limit(input.limit)
          .get();
        
        const leaderboard = await Promise.all(
          snapshot.docs.map(async (doc, index) => {
            const data = doc.data();
            
            // Get additional stats from userStats
            const statsDoc = await db.collection('userStats').doc(doc.id).get();
            const stats = statsDoc.exists ? statsDoc.data() : {};
            
            return {
              rank: offset + index + 1,
              userId: data.userId,
              username: data.username || "Anonymous",
              highScore: data.highScore || 0,
              coins: stats?.coins || 0,
              totalClicks: stats?.totalClicks || 0,
              lastPlayed: data.lastPlayed?.toDate() || null
            };
          })
        );
        
        return {
          leaderboard,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalPlayers,
            totalPages: Math.ceil(totalPlayers / input.limit)
          }
        };
      } catch (error) {
        console.error("Firestore getLeaderboard error:", error);
        return { leaderboard: [], pagination: { page: 0, limit: input.limit, total: 0, totalPages: 0 } };
      }
    }),
  
  // Get player's position with neighbors (for "around me" view)
  getPlayerContext: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      try {
        const userId = ctx.user.id.toString();
        
        // Get all scores sorted
        const allScoresSnapshot = await db.collection('leaderboard')
          .orderBy('highScore', 'desc')
          .get();
        
        const allPlayers = allScoresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Find player position
        const playerIndex = allPlayers.findIndex(p => p.id === userId);
        if (playerIndex === -1) return null;
        
        // Get 2 players above and 2 below
        const start = Math.max(0, playerIndex - 2);
        const end = Math.min(allPlayers.length, playerIndex + 3);
        
        const contextPlayers = allPlayers.slice(start, end).map((p, index) => ({
          rank: start + index + 1,
          userId: p.userId,
          username: p.username,
          highScore: p.highScore,
          isCurrentPlayer: p.id === userId
        }));
        
        return {
          currentPlayer: {
            rank: playerIndex + 1,
            highScore: allPlayers[playerIndex]?.highScore || 0,
            username: allPlayers[playerIndex]?.username || "Player"
          },
          context: contextPlayers,
          totalPlayers: allPlayers.length
        };
      } catch (error) {
        console.error("Firestore getPlayerContext error:", error);
        return null;
      }
    }),
  
  // Get user's personal stats
  getMyStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      try {
        const userId = ctx.user.id.toString();
        const statsRef = db.collection('userStats').doc(userId);
        const statsDoc = await statsRef.get();
        
        if (!statsDoc.exists) {
          return {
            coins: 0,
            totalClicks: 0,
            sessionClicks: 0,
            upgradeLevels: {},
            achievements: []
          };
        }
        
        const data = statsDoc.data();
        return {
          coins: data?.coins || 0,
          totalClicks: data?.totalClicks || 0,
          sessionClicks: data?.sessionClicks || 0,
          upgradeLevels: data?.upgradeLevels || {},
          achievements: data?.achievements || [],
          lastUpdated: data?.updatedAt?.toDate() || null
        };
      } catch (error) {
        console.error("Firestore getMyStats error:", error);
        return null;
      }
    }),
  
  // Reset player data (for testing)
  resetData: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      const userId = ctx.user.id.toString();
      
      try {
        // Reset stats but keep user document
        await db.collection('userStats').doc(userId).set({
          coins: 0,
          totalClicks: 0,
          sessionClicks: 0,
          upgradeLevels: {},
          achievements: [],
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { success: true, message: "Data reset to zero" };
      } catch (error) {
        console.error("Firestore resetData error:", error);
        throw new Error("Failed to reset data");
      }
    })
});

// Helper function to get player rank
async function getPlayerRank(userId: string): Promise<number | null> {
  try {
    const snapshot = await db.collection('leaderboard')
      .orderBy('highScore', 'desc')
      .get();
    
    const rank = snapshot.docs.findIndex(doc => doc.id === userId);
    return rank >= 0 ? rank + 1 : null;
  } catch (error) {
    console.error("getPlayerRank error:", error);
    return null;
  }
}
