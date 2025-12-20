import Layout from "@/components/Layout";
import Clicker from "@/components/Clicker";
import Shop from "@/components/Shop";
import SlotMachine from "@/components/SlotMachine";
import DiceGame from "@/components/DiceGame";
import BlackjackGame from "@/components/BlackjackGame";
import RouletteGame from "@/components/RouletteGame";
import PokerGame from "@/components/PokerGame";
import ChipExchange from "@/components/ChipExchange";
import Leaderboard from "@/components/Leaderboard";
import Settings from "@/components/Settings";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

function GameDashboard() {
  const { state } = useGame();

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* Left Column: Clicker & Slots (The "Floor") */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-black/40 border-amber-500/20 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <Clicker />
            </CardContent>
          </Card>

          <div className="grid gap-8 md:grid-cols-1">
            <SlotMachine />
          </div>

          {/* High Roller Area (Unlockable) */}
          {(state.upgrades.diceGame || state.upgrades.blackjackGame || state.upgrades.rouletteGame) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <h2 className="text-2xl font-display font-bold text-amber-200 uppercase tracking-widest">
                  VIP Lounge
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
              </div>

              <ChipExchange />

              <Tabs defaultValue={state.upgrades.diceGame ? "dice" : state.upgrades.blackjackGame ? "blackjack" : state.upgrades.rouletteGame ? "roulette" : "poker"} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-amber-500/20">
                  <TabsTrigger 
                    value="dice" 
                    disabled={!state.upgrades.diceGame}
                    className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                  >
                    Dice {state.upgrades.diceGame ? "" : "🔒"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="blackjack" 
                    disabled={!state.upgrades.blackjackGame}
                    className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white"
                  >
                    Blackjack {state.upgrades.blackjackGame ? "" : "🔒"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="roulette" 
                    disabled={!state.upgrades.rouletteGame}
                    className="data-[state=active]:bg-green-700 data-[state=active]:text-white"
                  >
                    Roulette {state.upgrades.rouletteGame ? "" : "🔒"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="poker" 
                    disabled={!state.upgrades.vipStatus}
                    className="data-[state=active]:bg-purple-700 data-[state=active]:text-white"
                  >
                    Poker {state.upgrades.vipStatus ? "" : "🔒"}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="dice" className="mt-4">
                  <DiceGame />
                </TabsContent>
                <TabsContent value="blackjack" className="mt-4">
                  <BlackjackGame />
                </TabsContent>
                <TabsContent value="roulette" className="mt-4">
                  <RouletteGame />
                </TabsContent>
                <TabsContent value="poker" className="mt-4">
                  <PokerGame />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Right Column: Shop, Leaderboard & Settings */}
        <div className="lg:col-span-7">
          <Tabs defaultValue="shop" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-amber-500/20 mb-6">
              <TabsTrigger 
                value="shop"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                🛒 Shop
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                🏆 Leaderboard
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                ⚙️ Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="shop">
              <Shop />
            </TabsContent>
            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>
            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameDashboard />
    </GameProvider>
  );
}
