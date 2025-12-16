import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, getCountFromServer, DocumentData } from "firebase/firestore";

interface TopPlayer {
  rank: number;
  username: string;
  highScore: number;
  userId: string;
}

interface LeaderboardStats {
  totalPlayers: number;
  totalCoins: number;
  highestScore: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const { state } = useGame();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalPlayers: 0,
    totalCoins: 0,
    highestScore: 0,
  });
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data from Firebase
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get top 10 players
      const playersQuery = query(
        collection(db, "players"),
        orderBy("highScore", "desc"),
        limit(10)
      );
      
      const playersSnapshot = await getDocs(playersQuery);
      const players: TopPlayer[] = [];
      let totalCoins = 0;
      let highestScore = 0;
      
      playersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        const highScore = data.highScore || 0;
        totalCoins += data.coins || 0;
        highestScore = Math.max(highestScore, highScore);
        
        players.push({
          rank: index + 1,
          username: data.username || "Anonymous",
          highScore: highScore,
          userId: doc.id
        });
        
        // Check if this is the current user
        if (user && doc.id === user.uid) {
          setPlayerRank(index + 1);
        }
      });
      
      setTopPlayers(players);
      
      // 2. Get total player count
      const countSnapshot = await getCountFromServer(collection(db, "players"));
      const totalPlayers = countSnapshot.data().count;
      
      // 3. Update stats
      setStats({
        totalPlayers,
        totalCoins,
        highestScore
      });
      
      // 4. If user not in top 10, find their rank
      if (user && !playerRank) {
        await findUserRank(user.uid);
      }
      
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Find user's rank if not in top 10
  const findUserRank = async (userId: string) => {
    try {
      const allPlayersQuery = query(
        collection(db, "players"),
        orderBy("highScore", "desc")
      );
      
      const allPlayersSnapshot = await getDocs(allPlayersQuery);
      const allPlayers: DocumentData[] = [];
      
      allPlayersSnapshot.forEach((doc) => {
        allPlayers.push({ id: doc.id, ...doc.data() });
      });
      
      const userIndex = allPlayers.findIndex(player => player.id === userId);
      if (userIndex >= 0) {
        setPlayerRank(userIndex + 1);
      }
    } catch (error) {
      console.error("Failed to find user rank:", error);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchLeaderboardData();
    
    const interval = setInterval(() => {
      fetchLeaderboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Manually refresh when user's coins change
  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [state.coins, user]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/60 text-sm uppercase tracking-wider">Total Players</p>
                <p className="text-3xl font-bold text-amber-100 mt-2">{stats.totalPlayers}</p>
              </div>
              <Users className="w-12 h-12 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/60 text-sm uppercase tracking-wider">Highest Score</p>
                <p className="text-3xl font-bold text-amber-100 mt-2">${stats.highestScore.toLocaleString()}</p>
              </div>
              <Trophy className="w-12 h-12 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/60 text-sm uppercase tracking-wider">Total Coins</p>
                <p className="text-3xl font-bold text-amber-100 mt-2">${(stats.totalCoins / 1000).toFixed(1)}K</p>
              </div>
              <TrendingUp className="w-12 h-12 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Rank (if logged in) */}
      {user && playerRank && (
        <Card className="bg-gradient-to-r from-amber-900/30 to-amber-800/30 border-amber-500/50 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200/60 text-sm uppercase tracking-wider">Your Rank</p>
                <p className="text-4xl font-bold text-amber-100 mt-2">#{playerRank}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-200/60 text-sm uppercase tracking-wider">Your Score</p>
                <p className="text-3xl font-bold text-amber-100 mt-2">${state.coins.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Players Table */}
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <CardTitle className="text-2xl font-display text-amber-200">🏆 Top Players</CardTitle>
          <CardDescription className="text-amber-200/50">Global leaderboard rankings</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8 text-amber-200/60">Loading leaderboard...</div>
          ) : topPlayers.length === 0 ? (
            <div className="text-center py-8 text-amber-200/60">
              No players yet. Click the coin to start playing!
            </div>
          ) : (
            <div className="space-y-3">
              {topPlayers.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    user && player.userId === user.uid
                      ? "bg-gradient-to-r from-amber-900/30 to-amber-800/30 border-amber-500/50"
                      : "bg-amber-900/10 border-amber-500/20 hover:bg-amber-900/20"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 font-bold text-amber-100">
                      {player.rank === 1 && "🥇"}
                      {player.rank === 2 && "🥈"}
                      {player.rank === 3 && "🥉"}
                      {player.rank > 3 && player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-amber-100">
                        {player.username}
                        {user && player.userId === user.uid && (
                          <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-amber-200/60">Rank #{player.rank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-100">${player.highScore.toLocaleString()}</p>
                    <p className="text-xs text-amber-200/60">{Math.floor(player.highScore / 10)} chips</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchLeaderboardData}
          disabled={loading}
          className="px-6 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing..." : "🔄 Refresh Leaderboard"}
        </button>
      </div>
    </div>
  );
}
