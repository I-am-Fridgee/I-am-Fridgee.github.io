import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Medal, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: topPlayers, isLoading } = trpc.leaderboard.getTop.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Trophy className="w-5 h-5 text-amber-700/50" />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-600/20 to-yellow-900/20 border-yellow-500/40";
    if (rank === 2) return "from-gray-400/20 to-gray-700/20 border-gray-400/40";
    if (rank === 3) return "from-amber-600/20 to-amber-900/20 border-amber-600/40";
    return "from-zinc-800/20 to-zinc-900/20 border-zinc-700/30";
  };

  return (
    <Card className="h-full bg-black/40 border-amber-500/30 backdrop-blur-md text-amber-50 shadow-2xl">
      <CardHeader className="border-b border-amber-500/20 pb-4">
        <CardTitle className="text-2xl font-display text-amber-200 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Hall of Fortune
        </CardTitle>
        <p className="text-xs text-amber-200/50 uppercase tracking-widest">Top 10 High Rollers</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-amber-500/50">
              Loading leaderboard...
            </div>
          ) : !topPlayers || topPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-amber-500/50 gap-2">
              <Trophy className="w-12 h-12 opacity-20" />
              <p className="text-sm">No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topPlayers.map((player, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative overflow-hidden rounded-lg border p-4 
                      bg-gradient-to-r ${getRankColor(rank)}
                      hover:scale-[1.02] transition-all duration-300
                    `}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 flex-shrink-0">
                          {getRankIcon(rank)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-amber-500/60">#{rank}</span>
                            <h3 className="font-bold text-amber-100 truncate">
                              {player.username}
                            </h3>
                          </div>
                          <p className="text-xs text-amber-200/40 mt-0.5">
                            {new Date(player.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold font-mono text-amber-400">
                          ${player.highScore.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Decorative shine effect for top 3 */}
                    {rank <= 3 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
