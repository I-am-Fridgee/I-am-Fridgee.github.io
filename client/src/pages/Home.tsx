import Layout from "@/components/Layout";
import Clicker from "@/components/Clicker";
import Shop from "@/components/Shop";
import SlotMachine from "@/components/SlotMachine";
import DiceGame from "@/components/DiceGame";
import BlackjackGame from "@/components/BlackjackGame";
import RouletteGame from "@/components/RouletteGame";
import ChipExchange from "@/components/ChipExchange";
import Leaderboard from "@/components/Leaderboard";
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

              <Tabs defaultValue={state.upgrades.diceGame ? "dice" : state.upgrades.blackjackGame ? "blackjack" : "roulette"} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-amber-500/20">
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
              </Tabs>
            </div>
          )}
        </div>

        {/* Right Column: Shop & Leaderboard */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="sticky top-24 h-fit">
              <Shop />
            </div>
            <div className="sticky top-24 h-fit">
              <Leaderboard />
            </div>
          </div>
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
