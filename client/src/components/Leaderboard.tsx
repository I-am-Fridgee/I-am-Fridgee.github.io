import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface TopPlayer {
  rank: number;
  username: string;
  highScore: number;
  updatedAt: Date;
}

interface PlayerRank {
  rank: number | null;
  score: number;
  username: string;
  totalPlayers: any[];
}

interface LeaderboardStats {
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch top players
  const topPlayersQuery = trpc.leaderboard.getTopPlayers.useQuery({
    limit: 10,
    offset: 0,
  });

  // Fetch player's rank (only if authenticated)
  const playerRankQuery = trpc.leaderboard.getPlayerRank.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch stats
  const statsQuery = trpc.leaderboard.getStats.useQuery();

  useEffect(() => {
    if (topPlayersQuery.data) {
      setTopPlayers(topPlayersQuery.data);
    }
    if (playerRankQuery.data) {
      setPlayerRank(playerRankQuery.data);
    }
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
    
    setLoading(
      topPlayersQuery.isLoading || 
      playerRankQuery.isLoading || 
      statsQuery.isLoading
    );
  }, [topPlayersQuery.data, playerRankQuery.data, statsQuery.data, topPlayersQuery.isLoading, playerRankQuery.isLoading, statsQuery.isLoading]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-black/40 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-amber-200/60 text-sm">Highest Score</p>
                  <p className="text-2xl font-bold text-amber-100">
                    ${stats.highestScore.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-amber-200/60 text-sm">Total Players</p>
                  <p className="text-2xl font-bold text-amber-100">
                    {stats.totalPlayers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-amber-200/60 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-amber-100">
                    ${stats.averageScore.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-amber-500/20">
          <TabsTrigger 
            value="top"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
          >
            🏆 Top Players
          </TabsTrigger>
          {user && (
            <TabsTrigger 
              value="myrank"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              📊 My Rank
            </TabsTrigger>
          )}
        </TabsList>

        {/* Top Players Tab */}
        <TabsContent value="top" className="mt-4">
          <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-amber-200">Global Leaderboard</CardTitle>
              <CardDescription className="text-amber-200/50">
                Top 10 players by highest score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 bg-amber-900/20" />
                  ))}
                </div>
              ) : topPlayers.length > 0 ? (
                <div className="space-y-2">
                  {topPlayers.map((player) => (
                    <div
                      key={player.rank}
                      className="flex items-center justify-between p-4 rounded-lg bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center font-bold text-amber-200">
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : `#${player.rank}`}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-100">{player.username}</p>
                          <p className="text-xs text-amber-200/50">
                            Updated {new Date(player.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-300">
                          ${player.highScore.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-amber-200/50 py-8">No players yet. Be the first!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Rank Tab */}
        {user && (
          <TabsContent value="myrank" className="mt-4">
            <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-amber-200">Your Stats</CardTitle>
                <CardDescription className="text-amber-200/50">
                  Your position on the leaderboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-32 bg-amber-900/20" />
                ) : playerRank ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-amber-200/60 text-sm mb-2">Your Rank</p>
                          <p className="text-4xl font-bold text-amber-300">
                            {playerRank.rank ? `#${playerRank.rank}` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-200/60 text-sm mb-2">Your Score</p>
                          <p className="text-4xl font-bold text-amber-300">
                            ${playerRank.score.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-amber-200/60 text-sm mb-2">Total Players</p>
                          <p className="text-4xl font-bold text-amber-300">
                            {playerRank.totalPlayers.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    {playerRank.rank && (
                      <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                        <p className="text-emerald-200 text-center">
                          🎉 You're in the top {Math.round((playerRank.rank / playerRank.totalPlayers.length) * 100)}% of players!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-amber-200/50 py-8">
                    No score submitted yet. Start playing to appear on the leaderboard!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
