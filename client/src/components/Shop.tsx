import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Zap, MousePointer2, Clock, Palette, Dices, Spade, Sparkles, TrendingUp, Crown, DollarSign, Gem, Star, Flame, Target } from "lucide-react";

export default function Shop() {
  const { state, purchaseUpgrade } = useGame();

  const upgrades = [
    {
      id: "doubleClick",
      name: "Double Click",
      description: "Earn $2 per click instead of $1.",
      cost: 50,
      icon: <MousePointer2 className="w-5 h-5 text-amber-400" />,
      purchased: state.upgrades.doubleClick,
      oneTime: true,
    },
    {
      id: "tripleClick",
      name: "Triple Click",
      description: "Earn $3 per click instead of $1.",
      cost: 200,
      icon: <MousePointer2 className="w-5 h-5 text-amber-300" />,
      purchased: state.upgrades.tripleClick,
      oneTime: true,
    },
    {
      id: "clickPowerII",
      name: "Click Power II",
      description: "Increase base click value by +1 (Stacks).",
      cost: 1500,
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      purchased: false, // Always purchasable
      count: state.upgrades.clickPowerII,
      oneTime: false,
    },
    {
      id: "autoClicker",
      name: "Auto Clicker",
      description: "Earn $1 every 10 seconds automatically.",
      cost: 300,
      icon: <Clock className="w-5 h-5 text-blue-400" />,
      purchased: state.upgrades.autoClicker,
      oneTime: true,
    },
    {
      id: "autoClickerBoost",
      name: "Auto Clicker Boost",
      description: "Boost Auto Clicker to $5 every 10s.",
      cost: 1000,
      icon: <Clock className="w-5 h-5 text-blue-300" />,
      purchased: state.upgrades.autoClickerBoost,
      oneTime: true,
      requires: "autoClicker",
    },
    {
      id: "goldenDollar",
      name: "Golden Dollar",
      description: "Double your click value permanently.",
      cost: 500,
      icon: <div className="text-xl">💰</div>,
      purchased: state.upgrades.goldenDollar,
      oneTime: true,
    },
    {
      id: "confettiClick",
      name: "Confetti Click",
      description: "Throws random particles on click.",
      cost: 75,
      icon: <div className="text-xl">🎉</div>,
      purchased: state.upgrades.confettiClick,
      oneTime: true,
    },
    {
      id: "backgroundTheme",
      name: "Cool Theme",
      description: "Change background to a cool theme.",
      cost: 80,
      icon: <Palette className="w-5 h-5 text-purple-400" />,
      purchased: state.upgrades.backgroundTheme,
      oneTime: true,
    },
    {
      id: "diceGame",
      name: "Dice Game",
      description: "Unlock the Dice betting game.",
      cost: 500,
      icon: <Dices className="w-5 h-5 text-red-400" />,
      purchased: state.upgrades.diceGame,
      oneTime: true,
    },
    {
      id: "blackjackGame",
      name: "Blackjack",
      description: "Unlock the Blackjack card game.",
      cost: 1000,
      icon: <Spade className="w-5 h-5 text-slate-200" />,
      purchased: state.upgrades.blackjackGame,
      oneTime: true,
    },
    // New Upgrades
    {
      id: "megaClick",
      name: "Mega Click",
      description: "Earn $10 per click.",
      cost: 5000,
      icon: <MousePointer2 className="w-5 h-5 text-red-500" />,
      purchased: state.upgrades.megaClick,
      oneTime: true,
    },
    {
      id: "superAutoClicker",
      name: "Super Auto Clicker",
      description: "Auto clicker earns $10 every 10s.",
      cost: 3000,
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
      purchased: state.upgrades.superAutoClicker,
      oneTime: true,
      requires: "autoClicker",
    },
    {
      id: "turboMode",
      name: "Turbo Mode",
      description: "Auto clicker speed doubles (every 5s).",
      cost: 2500,
      icon: <Zap className="w-5 h-5 text-orange-400" />,
      purchased: state.upgrades.turboMode,
      oneTime: true,
      requires: "autoClicker",
    },
    {
      id: "luckyGambler",
      name: "Lucky Gambler",
      description: "Increase odds in all games by 5%.",
      cost: 1500,
      icon: <Star className="w-5 h-5 text-yellow-300" />,
      purchased: state.upgrades.luckyGambler,
      oneTime: true,
    },
    {
      id: "vipStatus",
      name: "VIP Status",
      description: "Unlock exclusive features and bonuses.",
      cost: 10000,
      icon: <Crown className="w-5 h-5 text-purple-400" />,
      purchased: state.upgrades.vipStatus,
      oneTime: true,
    },
    {
      id: "moneyMagnet",
      name: "Money Magnet",
      description: "Passive income: $50 every 30 seconds.",
      cost: 4000,
      icon: <DollarSign className="w-5 h-5 text-green-400" />,
      purchased: state.upgrades.moneyMagnet,
      oneTime: true,
    },
    {
      id: "clickMultiplierX5",
      name: "Click Multiplier x5",
      description: "5x click value.",
      cost: 8000,
      icon: <TrendingUp className="w-5 h-5 text-pink-400" />,
      purchased: state.upgrades.clickMultiplierX5,
      oneTime: true,
    },
    {
      id: "diamondClicker",
      name: "Diamond Clicker",
      description: "Triple all earnings permanently.",
      cost: 15000,
      icon: <Gem className="w-5 h-5 text-blue-300" />,
      purchased: state.upgrades.diamondClicker,
      oneTime: true,
    },
    {
      id: "fortuneBoost",
      name: "Fortune Boost",
      description: "Slot machine jackpot odds improve.",
      cost: 6000,
      icon: <Target className="w-5 h-5 text-amber-400" />,
      purchased: state.upgrades.fortuneBoost,
      oneTime: true,
    },
    {
      id: "highRoller",
      name: "High Roller",
      description: "Unlock max bet limits in games.",
      cost: 20000,
      icon: <Flame className="w-5 h-5 text-red-600" />,
      purchased: state.upgrades.highRoller,
      oneTime: true,
    },
    {
      id: "rouletteGame",
      name: "Roulette",
      description: "Unlock the Roulette wheel game.",
      cost: 2000,
      icon: <div className="text-xl">🎰</div>,
      purchased: state.upgrades.rouletteGame,
      oneTime: true,
    },
    // Cosmetics
    {
      id: "neonGlow",
      name: "Neon Glow Effect",
      description: "Adds neon glow to the clicker.",
      cost: 150,
      icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
      purchased: state.upgrades.neonGlow,
      oneTime: true,
    },
    {
      id: "particleTrail",
      name: "Particle Trail",
      description: "Colorful particle trail on mouse.",
      cost: 250,
      icon: <Sparkles className="w-5 h-5 text-pink-300" />,
      purchased: state.upgrades.particleTrail,
      oneTime: true,
    },
    {
      id: "premiumTheme",
      name: "Premium Theme",
      description: "Exclusive dark purple/gold scheme.",
      cost: 500,
      icon: <Palette className="w-5 h-5 text-indigo-400" />,
      purchased: state.upgrades.premiumTheme,
      oneTime: true,
    },
  ];

  return (
    <Card className="h-full bg-black/40 border-amber-500/30 backdrop-blur-md text-amber-50 shadow-2xl">
      <CardHeader className="border-b border-amber-500/20 pb-4">
        <CardTitle className="text-2xl font-display text-amber-200 flex items-center gap-2">
          <span>🛒</span> The Exchange
        </CardTitle>
        <CardDescription className="text-amber-200/50">
          Invest your earnings to maximize profit.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] p-4">
          <div className="grid gap-4">
            {upgrades.map((item) => {
              // Check requirements
              // @ts-ignore
              if (item.requires && !state.upgrades[item.requires]) {
                return null;
              }

              const isAffordable = state.coins >= item.cost;
              const isPurchased = item.oneTime && item.purchased;

              return (
                <div
                  key={item.id}
                  className={`
                    relative group overflow-hidden rounded-lg border p-4 transition-all duration-300
                    ${isPurchased 
                      ? "bg-emerald-900/20 border-emerald-500/30 opacity-60" 
                      : "bg-zinc-900/60 border-amber-500/20 hover:border-amber-500/60 hover:bg-zinc-800/80"
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`
                        p-3 rounded-full bg-black/40 border border-white/5
                        ${isPurchased ? "text-emerald-400" : "text-amber-100"}
                      `}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-100 flex items-center gap-2">
                          {item.name}
                          {item.count !== undefined && item.count > 0 && (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                              Lvl {item.count}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-amber-200/60 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isPurchased ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                          Owned
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!isAffordable}
                          onClick={() => purchaseUpgrade(item.id as any, item.cost)}
                          className={`
                            font-mono font-bold transition-all
                            ${isAffordable 
                              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            }
                          `}
                        >
                          ${item.cost}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
