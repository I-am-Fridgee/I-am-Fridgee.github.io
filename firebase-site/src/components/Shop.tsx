import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface ShopItem {
  key: keyof typeof initialUpgrades;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: "clicker" | "passive" | "cosmetic" | "game";
  requiresVIP?: boolean;
  stackable?: boolean;
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
  // Click Power Upgrades - OLD PRICES
  {
    key: "doubleClick",
    name: "Double Click",
    description: "Earn $2 per click instead of $1",
    cost: 50,
    icon: "👆",
    category: "clicker",
  },
  {
    key: "tripleClick",
    name: "Triple Click",
    description: "Earn $3 per click instead of $1",
    cost: 200,
    icon: "✌️",
    category: "clicker",
  },
  {
    key: "megaClick",
    name: "Mega Click",
    description: "Earn $10 per click",
    cost: 5000,
    icon: "💥",
    category: "clicker",
  },
  {
    key: "clickPowerII",
    name: "Click Power II",
    description: "+1 per click (Stacks, cost increases 1.5x each purchase)",
    cost: 1500,
    icon: "⚡",
    category: "clicker",
    stackable: true,
  },

  // Multipliers
  {
    key: "goldenDollar",
    name: "Golden Dollar",
    description: "Times your Cliking Power by x2!",
    cost: 1000,
    icon: "💰",
    category: "clicker",
  },
  {
    key: "clickMultiplierX5",
    name: "Click Multiplier ×5",
    description: "×5 click power",
    cost: 15000,
    icon: "🔥",
    category: "clicker",
  },
  {
    key: "diamondClicker",
    name: "Diamond Clicker",
    description: "×3 click power",
    cost: 8000,
    icon: "💎",
    category: "clicker",
  },

  // Auto Clickers
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
    cost: 500,
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
    description: "Texas Hold'em (VIP Only)",
    cost: 10000,
    icon: "♠️",
    category: "game",
    requiresVIP: true,
  },

  // Special
  {
    key: "highRoller",
    name: "High Roller",
    description: "Bet unlimited chips in games",
    cost: 20000,
    icon: "👑",
    category: "clicker",
  },
  {
    key: "vipStatus",
    name: "VIP Status",
    description: "Unlock exclusive features & poker",
    cost: 17777,
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
    description: "Purple & gold theme (VIP Only)",
    cost: 5000,
    icon: "👑",
    category: "cosmetic",
    requiresVIP: true,
  },
  {
    key: "rainbowClicker",
    name: "Rainbow Clicker",
    description: "Rainbow colors (VIP Only)",
    cost: 350,
    icon: "🌈",
    category: "cosmetic",
    requiresVIP: true,
  },
  {
    key: "starryBackground",
    name: "Starry Night",
    description: "Animated stars (VIP Only)",
    cost: 1500,
    icon: "✨",
    category: "cosmetic",
    requiresVIP: true,
  },
  {
    key: "goldenFrame",
    name: "Golden Frame",
    description: "Gold border (VIP Only)",
    cost: 800,
    icon: "🖼️",
    category: "cosmetic",
    requiresVIP: true,
  },
  {
    key: "fireworksEffect",
    name: "Fireworks",
    description: "Big win fireworks (VIP Only)",
    cost: 1200,
    icon: "🎆",
    category: "cosmetic",
    requiresVIP: true,
  },
  {
    key: "velvetCurtains",
    name: "Velvet Curtains",
    description: "Theater curtains (VIP Only)",
    cost: 500,
    icon: "🎭",
    category: "cosmetic",
    requiresVIP: true,
  },
];

export default function Shop() {
  const { state, purchaseUpgrade } = useGame();

  const handlePurchase = (item: ShopItem) => {
    // Check VIP requirement
    if (item.requiresVIP && !state.upgrades.vipStatus) {
      toast.error(`${item.name} requires VIP Status!`);
      return;
    }

    // Check if already purchased (for non-stackable items)
    if (!item.stackable && state.upgrades[item.key]) {
      toast.info(`${item.name} already purchased!`);
      return;
    }

    // Calculate cost for stackable items
    let finalCost = item.cost;
    if (item.stackable && typeof state.upgrades[item.key] === "number") {
      finalCost = Math.floor(item.cost * Math.pow(1.5, state.upgrades[item.key]));
    }

    if (purchaseUpgrade(item.key, finalCost)) {
      toast.success(`Purchased ${item.name}!`);
    } else {
      toast.error(`Not enough coins! Need $${finalCost}`);
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
                const isPurchased = !item.stackable && state.upgrades[item.key];
                const isLockedByVIP = item.requiresVIP && !state.upgrades.vipStatus;

                // Calculate cost for stackable items
                let displayCost = item.cost;
                if (item.stackable && typeof state.upgrades[item.key] === "number") {
                  displayCost = Math.floor(item.cost * Math.pow(1.5, state.upgrades[item.key]));
                }

                return (
                  <Card
                    key={item.key}
                    className={`bg-black/40 border-amber-500/30 backdrop-blur-md transition-all ${
                      isPurchased
                        ? "opacity-50"
                        : isLockedByVIP
                          ? "border-red-500/30 opacity-60"
                          : "hover:border-amber-500/60"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-4xl">{item.icon}</div>
                        {isLockedByVIP && <Lock className="w-5 h-5 text-red-500" />}
                      </div>
                      <h3 className="text-amber-100 font-semibold">{item.name}</h3>
                      <p className="text-amber-200/60 text-sm mb-3">{item.description}</p>
                      {item.stackable && typeof state.upgrades[item.key] === "number" && (
                        <p className="text-yellow-300 text-xs mb-2">
                          Owned: {state.upgrades[item.key]}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-amber-300 font-bold">${displayCost.toLocaleString()}</span>
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={isPurchased || isLockedByVIP}
                          className={`text-xs ${
                            isPurchased
                              ? "bg-gray-600 cursor-not-allowed"
                              : isLockedByVIP
                                ? "bg-red-600 cursor-not-allowed"
                                : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          {isPurchased
                            ? "✓ Owned"
                            : isLockedByVIP
                              ? "🔒 VIP"
                              : "Buy"}
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
