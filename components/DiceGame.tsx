import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Dices } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function DiceGame() {
  const { state, removeChips, addChips } = useGame();
  const [bet, setBet] = useState("");
  const [choice, setChoice] = useState<"even" | "odd" | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const play = () => {
    const betAmount = parseInt(bet);
    if (!choice) {
      toast.error("Choose Even or Odd!");
      return;
    }
    if (isNaN(betAmount) || betAmount <= 0) {
      toast.error("Invalid bet amount");
      return;
    }
    if (state.chips < betAmount) {
      toast.error("Not enough chips!");
      return;
    }

    if (removeChips(betAmount)) {
      setRolling(true);
      setResult(null);

      setTimeout(() => {
        // Roll 1-6
        const roll = Math.floor(Math.random() * 6) + 1;
        setResult(roll);
        setRolling(false);

        const isEven = roll % 2 === 0;
        const win = (choice === "even" && isEven) || (choice === "odd" && !isEven);

        if (win) {
          // Lucky Gambler: maybe a small bonus? Standard is 2x.
          const winnings = betAmount * 2;
          addChips(winnings);
          toast.success(`Rolled ${roll}! You won ${winnings} Chips!`);
        } else {
          toast.error(`Rolled ${roll}. You lost ${betAmount} Chips.`);
        }
      }, 1000);
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-red-900/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display font-bold text-red-400 flex items-center gap-2">
          <Dices /> High Roller Dice
        </h3>
      </div>

      <div className="flex justify-center mb-8 h-24 items-center">
        {rolling ? (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
            className="text-6xl"
          >
            🎲
          </motion.div>
        ) : (
          <div className="text-6xl font-bold text-white">
            {result !== null ? result : "?"}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={choice === "even" ? "default" : "outline"}
            onClick={() => setChoice("even")}
            className={`flex-1 ${choice === "even" ? "bg-blue-600" : "border-zinc-700 text-zinc-400"}`}
          >
            EVEN (2,4,6)
          </Button>
          <Button
            variant={choice === "odd" ? "default" : "outline"}
            onClick={() => setChoice("odd")}
            className={`flex-1 ${choice === "odd" ? "bg-red-600" : "border-zinc-700 text-zinc-400"}`}
          >
            ODD (1,3,5)
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Bet Amount"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            className="bg-black/50 border-zinc-700 text-white"
          />
          <Button 
            onClick={play} 
            disabled={rolling}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8"
          >
            ROLL
          </Button>
        </div>
      </div>
    </div>
  );
}
