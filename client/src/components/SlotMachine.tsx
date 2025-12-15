import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SYMBOLS = [
  { icon: "7️⃣", name: "Jackpot", prize: 10000, weight: 1 }, // Extremely Rare
  { icon: "🤑", name: "Money", prize: 5000, weight: 2 },
  { icon: "?", name: "Mystery", prize: 0, weight: 4 }, // Dynamic prize
  { icon: "🍞", name: "Bread", prize: 500, weight: 10 },
  { icon: "🍎", name: "Apple", prize: 100, weight: 18 },
  { icon: "🍬", name: "Candy", prize: 10, weight: 30 },
  { icon: "❌", name: "Miss", prize: 0, weight: 60 }, // Common but not overwhelming
];

export default function SlotMachine() {
  const { state, removeCoins, addCoins } = useGame();
  const [reels, setReels] = useState(["7️⃣", "7️⃣", "7️⃣"]);
  const [isSpinning, setIsSpinning] = useState(false);

  const spin = () => {
    if (state.coins < 1) {
      toast.error("Not enough coins! Need $1 to spin.");
      return;
    }

    if (removeCoins(1)) {
      setIsSpinning(true);
      
      // Animation duration
      let duration = 2000;
      const interval = setInterval(() => {
        setReels([
          getRandomSymbol().icon,
          getRandomSymbol().icon,
          getRandomSymbol().icon
        ]);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        finalizeSpin();
      }, duration);
    }
  };

  const getRandomSymbol = () => {
    // Weighted random selection
    const totalWeight = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    // "Lucky Gambler" logic: slightly reduce the random threshold to favor better items?
    // Or just simple weighted random for now.
    
    for (const symbol of SYMBOLS) {
      if (random < symbol.weight) return symbol;
      random -= symbol.weight;
    }
    return SYMBOLS[SYMBOLS.length - 1];
  };

  const finalizeSpin = () => {
    // Generate 3 completely independent random reels
    const reel1 = getRandomSymbol();
    const reel2 = getRandomSymbol();
    const reel3 = getRandomSymbol();
    
    setReels([reel1.icon, reel2.icon, reel3.icon]);
    
    // Check if all 3 match (winning condition)
    if (reel1.name === reel2.name && reel2.name === reel3.name && reel1.name !== "Miss") {
      let prize = reel1.prize;
      
      if (reel1.name === "Mystery") {
        prize = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
      }
      
      // Apply Lucky Gambler bonus if unlocked
      if (state.upgrades.fortuneBoost) {
        prize = Math.floor(prize * 1.1); // 10% bonus
      }
      
      addCoins(prize);
      toast.success(`🎰 JACKPOT! You won $${prize.toLocaleString()} (${reel1.name})!`, {
        duration: 4000,
      });
    } else {
      // No match = loss
      toast("Better luck next time!", { duration: 2000 });
    }
    
    setIsSpinning(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-6 bg-zinc-900 rounded-xl border-4 border-amber-600 shadow-2xl">
      {/* Decorative Top */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-600 px-6 py-1 rounded-t-lg border-t border-l border-r border-amber-400">
        <span className="font-display font-bold text-black uppercase tracking-widest">Fortune 777</span>
      </div>

      {/* Reels Display */}
      <div className="flex justify-center gap-2 bg-black p-4 rounded-lg border-inner border-zinc-800 mb-6 relative overflow-hidden">
        {/* Glass Reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-10" />
        
        {reels.map((symbol, i) => (
          <div key={i} className="w-20 h-24 bg-white rounded flex items-center justify-center text-5xl border-2 border-zinc-300 shadow-inner">
            <motion.div
              animate={isSpinning ? { y: [0, -20, 0] } : {}}
              transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.1 }}
            >
              {symbol}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-amber-400 font-mono text-sm">Cost: $1 / Spin</div>
        <Button 
          size="lg" 
          onClick={spin} 
          disabled={isSpinning}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xl py-6 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
        >
          {isSpinning ? "SPINNING..." : "SPIN!"}
        </Button>
      </div>

      {/* Paytable Hint */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-zinc-500 text-center">
        <div>7️⃣ $10k</div>
        <div>🤑 $5k</div>
        <div>? $1k-5k</div>
        <div>🍞 $500</div>
        <div>🍎 $100</div>
        <div>🍬 $10</div>
      </div>
    </div>
  );
}
