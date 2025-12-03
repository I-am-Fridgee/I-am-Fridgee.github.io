import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export default function RouletteGame() {
  const { state, removeChips, addChips } = useGame();
  const [bet, setBet] = useState("");
  const [betType, setBetType] = useState<"red" | "black" | "even" | "odd" | "number" | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const spin = () => {
    const betAmount = parseInt(bet);
    if (!betType) {
      toast.error("Choose a bet type!");
      return;
    }
    if (betType === "number" && selectedNumber === null) {
      toast.error("Select a number!");
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
      setSpinning(true);
      setResult(null);

      setTimeout(() => {
        const spinResult = Math.floor(Math.random() * 37); // 0-36
        setResult(spinResult);
        setSpinning(false);

        let win = false;
        let payout = 0;

        if (betType === "number" && spinResult === selectedNumber) {
          win = true;
          payout = betAmount * 36; // 35:1 + original bet
        } else if (betType === "red" && RED_NUMBERS.includes(spinResult)) {
          win = true;
          payout = betAmount * 2;
        } else if (betType === "black" && BLACK_NUMBERS.includes(spinResult)) {
          win = true;
          payout = betAmount * 2;
        } else if (betType === "even" && spinResult !== 0 && spinResult % 2 === 0) {
          win = true;
          payout = betAmount * 2;
        } else if (betType === "odd" && spinResult % 2 !== 0) {
          win = true;
          payout = betAmount * 2;
        }

        if (win) {
          addChips(payout);
          toast.success(`${spinResult}! You won ${payout} Chips!`);
        } else {
          toast.error(`${spinResult}. You lost ${betAmount} Chips.`);
        }
      }, 2000);
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return "bg-green-600";
    if (RED_NUMBERS.includes(num)) return "bg-red-600";
    return "bg-black";
  };

  return (
    <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-xl border-8 border-amber-900 shadow-2xl">
      <h3 className="text-2xl font-display font-bold text-amber-100 mb-4 text-center">
        🎰 Roulette Wheel
      </h3>

      {/* Wheel Display */}
      <div className="flex justify-center mb-8 h-32 items-center">
        {spinning ? (
          <motion.div
            animate={{ rotate: 720 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-24 h-24 rounded-full border-8 border-amber-400 bg-gradient-to-br from-red-600 to-black flex items-center justify-center"
          >
            <div className="text-white font-bold text-2xl">?</div>
          </motion.div>
        ) : (
          <div className={`w-24 h-24 rounded-full border-8 border-amber-400 ${result !== null ? getNumberColor(result) : "bg-zinc-800"} flex items-center justify-center shadow-2xl`}>
            <div className="text-white font-bold text-4xl">
              {result !== null ? result : "?"}
            </div>
          </div>
        )}
      </div>

      {/* Betting Options */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={betType === "red" ? "default" : "outline"}
            onClick={() => { setBetType("red"); setSelectedNumber(null); }}
            className={`${betType === "red" ? "bg-red-600" : "border-zinc-700 text-zinc-400"}`}
            disabled={spinning}
          >
            RED (2x)
          </Button>
          <Button
            variant={betType === "black" ? "default" : "outline"}
            onClick={() => { setBetType("black"); setSelectedNumber(null); }}
            className={`${betType === "black" ? "bg-black" : "border-zinc-700 text-zinc-400"}`}
            disabled={spinning}
          >
            BLACK (2x)
          </Button>
          <Button
            variant={betType === "even" ? "default" : "outline"}
            onClick={() => { setBetType("even"); setSelectedNumber(null); }}
            className={`${betType === "even" ? "bg-blue-600" : "border-zinc-700 text-zinc-400"}`}
            disabled={spinning}
          >
            EVEN (2x)
          </Button>
          <Button
            variant={betType === "odd" ? "default" : "outline"}
            onClick={() => { setBetType("odd"); setSelectedNumber(null); }}
            className={`${betType === "odd" ? "bg-purple-600" : "border-zinc-700 text-zinc-400"}`}
            disabled={spinning}
          >
            ODD (2x)
          </Button>
        </div>

        {/* Number Selection */}
        <div>
          <Button
            variant={betType === "number" ? "default" : "outline"}
            onClick={() => setBetType("number")}
            className={`w-full ${betType === "number" ? "bg-amber-600" : "border-zinc-700 text-zinc-400"}`}
            disabled={spinning}
          >
            SINGLE NUMBER (36x) {selectedNumber !== null && `- ${selectedNumber}`}
          </Button>
          {betType === "number" && (
            <div className="grid grid-cols-10 gap-1 mt-2 max-h-32 overflow-y-auto">
              {NUMBERS.map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedNumber(num)}
                  className={`
                    p-2 rounded text-xs font-bold text-white
                    ${selectedNumber === num ? "ring-2 ring-yellow-400" : ""}
                    ${getNumberColor(num)}
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bet Input */}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Bet Amount (Chips)"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            className="bg-black/50 border-zinc-700 text-white"
            disabled={spinning}
          />
          <Button
            onClick={spin}
            disabled={spinning}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-8"
          >
            SPIN
          </Button>
        </div>
      </div>
    </div>
  );
}
