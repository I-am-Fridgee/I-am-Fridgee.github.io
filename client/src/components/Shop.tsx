import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

interface ShopItem {
  key: keyof typeof initialUpgrades;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: "clicker" | "passive" | "cosmetic" | "game";
}

const initialUpgrades = {
  doubleClick: true,
  tripleClick: true,
  clickPowerII: true,
  autoClicker: true,
  autoClickerBoost: true,
  autoClickerPro: true,
  autoClickerMax: true,
  hyperClicker: true,
  goldenDollar: true,
  confettiClick: true,
  backgroundTheme: true,
  diceGame: true,
  blackjackGame: true,
  megaClick: true,
  superAutoClicker: true,
  turboMode: true,
  luckyGambler: true,
  vipStatus: true,
  moneyMagnet: true,
  clickMultiplierX5: true,
  diamondClicker: true,
  fortuneBoost: true,
  highRoller: true,
  rouletteGame: true,
  pokerGame: true,
  neonGlow: true,
  particleTrail: true,
  premiumTheme: true,
  rainbowClicker: true,
  starryBackground: true,
  goldenFrame: true,
  fireworksEffect: true,
  velvetCurtains: true,
};

const SHOP_ITEMS: ShopItem[] = [
  // Click Power Upgrades
  {
    key: "doubleClick",
    name: "Double Click",
    description: "+1 per click",
    cost: 100,
    icon: "👆",
    category: "clicker",
  },
  {
    key: "tripleClick",
    name: "Triple Click",
    description: "+2 per click",
    cost: 500,
    icon: "✌️",
    category: "clicker",
  },
  {
    key: "megaClick",
    name: "Mega Click",
    description: "+9 per click",
    cost: 2000,
    icon: "💥",
    category: "clicker",
  },
  {
    key: "clickPowerII",
    name: "Click Power II",
    description: "+1 per click (stackable)",
    cost: 300,
    icon: "⚡",
    category: "clicker",
  },

  // Multipliers (REBALANCED)
  {
    key: "goldenDollar",
    name: "Golden Dollar",
    description: "×2 click power",
    cost: 1000,
    icon: "💰",
    category: "clicker",
  },
  {
    key: "clickMultiplierX5",
    name: "Click Multiplier ×5",
    description: "×5 click power",
    cost: 8000,
    icon: "🔥",
    category: "clicker",
  },
  {
    key: "diamondClicker",
    name: "Diamond Clicker",
    description: "×3 click power",
    cost: 12000,
    icon: "💎",
    category: "clicker",
  },

  // Auto Clickers (REBALANCED)
  {
    key: "autoClicker",
    name: "Auto Clicker",
    description: "$1 every 10 seconds",
    cost: 200,
    icon: "🤖",
    category: "passive",
  },
  {
    key: "autoClickerBoost",
    name: "Auto Clicker Boost",
    description: "$5 every 10 seconds",
    cost: 1000,
    icon: "⚙️",
    category: "passive",
  },
  {
    key: "autoClickerPro",
    name: "Auto Clicker Pro",
    description: "$15 every 10 seconds",
    cost: 3000,
    icon: "🚀",
    category: "passive",
  },
  {
    key: "autoClickerMax",
    name: "Auto Clicker Max",
    description: "$25 every 10 seconds",
    cost: 5000,
    icon: "⭐",
    category: "passive",
  },
  {
    key: "superAutoClicker",
    name: "Super Auto Clicker",
    description: "$10 every 10 seconds",
    cost: 2500,
    icon: "💫",
    category: "passive",
  },
  {
    key: "hyperClicker",
    name: "Hyper Clicker",
    description: "Every 3 seconds (faster)",
    cost: 4000,
    icon: "⚡",
    category: "passive",
  },
  {
    key: "turboMode",
    name: "Turbo Mode",
    description: "Every 5 seconds",
    cost: 2000,
    icon: "🏎️",
    category: "passive",
  },

  // Passive Income
  {
    key: "moneyMagnet",
    name: "Money Magnet",
    description: "$50 every 30 seconds",
    cost: 3000,
    icon: "🧲",
    category: "passive",
  },
  {
    key: "fortuneBoost",
    name: "Fortune Boost",
    description: "Increased passive income",
    cost: 5000,
    icon: "🍀",
    category: "passive",
  },

  // Games
  {
    key: "diceGame",
    name: "Dice Game",
    description: "Roll dice for coins",
    cost: 1000,
    icon: "🎲",
    category: "game",
  },
  {
    key: "blackjackGame",
    name: "Blackjack",
    description: "Classic card game",
    cost: 2000,
    icon: "🃏",
    category: "game",
  },
  {
    key: "rouletteGame",
    name: "Roulette",
    description: "Spin the wheel",
    cost: 2500,
    icon: "🎡",
    category: "game",
  },
  {
    key: "pokerGame",
    name: "Poker",
    description: "Texas Hold'em (50k entry)",
    cost: 5000,
    icon: "♠️",
    category: "game",
  },

  // Special
  {
    key: "highRoller",
    name: "High Roller",
    description: "Bet up to 1000 chips",
    cost: 10000,
    icon: "👑",
    category: "clicker",
  },
  {
    key: "vipStatus",
    name: "VIP Status",
    description: "Special perks & bonuses",
    cost: 15000,
    icon: "🎖️",
    category: "clicker",
  },
  {
    key: "luckyGambler",
    name: "Lucky Gambler",
    description: "Increased game winnings",
    cost: 8000,
    icon: "🍀",
    category: "clicker",
  },

  // Cosmetics
  {
    key: "confettiClick",
    name: "Confetti Click",
    description: "Particles on click",
    cost: 500,
    icon: "🎉",
    category: "cosmetic",
  },
  {
    key: "neonGlow",
    name: "Neon Glow",
    description: "Glowing effect",
    cost: 750,
    icon: "✨",
    category: "cosmetic",
  },
  {
    key: "particleTrail",
    name: "Particle Trail",
    description: "Cursor trail effect",
    cost: 600,
    icon: "🌟",
    category: "cosmetic",
  },
  {
    key: "backgroundTheme",
    name: "Cool Theme",
    description: "Alternative background",
    cost: 400,
    icon: "🎨",
    category: "cosmetic",
  },
  {
    key: "premiumTheme",
    name: "Premium Theme",
    description: "Purple & gold theme",
    cost: 1200,
    icon: "👑",
    category: "cosmetic",
  },
  {
    key: "rainbowClicker",
    name: "Rainbow Clicker",
    description: "Rainbow colors",
    cost: 350,
    icon: "🌈",
    category: "cosmetic",
  },
  {
    key: "starryBackground",
    name: "Starry Night",
    description: "Animated stars",
    cost: 600,
    icon: "✨",
    category: "cosmetic",
  },
  {
    key: "goldenFrame",
    name: "Golden Frame",
    description: "Gold border",
    cost: 800,
    icon: "🖼️",
    category: "cosmetic",
  },
  {
    key: "fireworksEffect",
    name: "Fireworks",
    description: "Big win fireworks",
    cost: 1200,
    icon: "🎆",
    category: "cosmetic",
  },
  {
    key: "velvetCurtains",
    name: "Velvet Curtains",
    description: "Theater curtains",
    cost: 1000,
    icon: "🎭",
    category: "cosmetic",
  },
];

export default function Shop() {
  const { state, purchaseUpgrade } = useGame();

  const handlePurchase = (item: ShopItem) => {
    if (state.upgrades[item.key]) {
      toast.info(`${item.name} already purchased!`);
      return;
    }

    if (purchaseUpgrade(item.key, item.cost)) {
      toast.success(`Purchased ${item.name}!`);
    } else {
      toast.error(`Not enough coins! Need $${item.cost}`);
    }
  };

  const categories = ["clicker", "passive", "game", "cosmetic"] as const;

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const items = SHOP_ITEMS.filter((item) => item.category === category);
        const categoryName = {
          clicker: "⚡ Click Power",
          passive: "💰 Passive Income",
          game: "🎮 Games",
          cosmetic: "✨ Cosmetics",
        }[category];

        return (
          <div key={category}>
            <h2 className="text-2xl font-display text-amber-200 mb-4">{categoryName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const isPurchased = state.upgrades[item.key];
                return (
                  <Card
                    key={item.key}
                    className={`bg-black/40 border-amber-500/30 backdrop-blur-md transition-all ${
                      isPurchased ? "opacity-50" : "hover:border-amber-500/60"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="text-4xl mb-2">{item.icon}</div>
                      <h3 className="text-amber-100 font-semibold">{item.name}</h3>
                      <p className="text-amber-200/60 text-sm mb-3">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-300 font-bold">${item.cost.toLocaleString()}</span>
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={isPurchased}
                          className={`text-xs ${
                            isPurchased
                              ? "bg-gray-600 cursor-not-allowed"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          {isPurchased ? "✓ Owned" : "Buy"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
