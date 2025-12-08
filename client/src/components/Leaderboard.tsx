import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { Trophy, TrendingUp, Users } from "lucide-react";

interface TopPlayer {
  rank: number;
  username: string;
  highScore: number;
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

  // Fetch top players
  const topPlayersQuery = trpc.leaderboard.getTopPlayers.useQuery();
  const statsQuery = trpc.leaderboard.getStats.useQuery();
  const playerRankQuery = trpc.leaderboard.getPlayerRank.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (topPlayersQuery.data) {
      setTopPlayers(topPlayersQuery.data);
    }
  }, [topPlayersQuery.data]);

  useEffect(() => {
    if (statsQuery.data) {
      setStats(statsQuery.data);
    }
  }, [statsQuery.data]);

  useEffect(() => {
    if (playerRankQuery.data) {
      setPlayerRank(playerRankQuery.data.rank);
    }
  }, [playerRankQuery.data]);

  useEffect(() => {
    if (topPlayersQuery.isLoading || statsQuery.isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [topPlayersQuery.isLoading, statsQuery.isLoading]);

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
            <div className="text-center py-8 text-amber-200/60">No players yet. Be the first!</div>
          ) : (
            <div className="space-y-3">
              {topPlayers.map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-4 rounded-lg bg-amber-900/10 border border-amber-500/20 hover:bg-amber-900/20 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 font-bold text-amber-100">
                      {player.rank === 1 && "🥇"}
                      {player.rank === 2 && "🥈"}
                      {player.rank === 3 && "🥉"}
                      {player.rank > 3 && player.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-amber-100">{player.username}</p>
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
    </div>
  );
}
