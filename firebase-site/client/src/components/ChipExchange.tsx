import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

export default function ChipExchange() {
  const { state, convertCoinsToChips, convertChipsToCoins } = useGame();
  const [amount, setAmount] = useState("");

  const handleConvert = (direction: "toChips" | "toCoins") => {
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (direction === "toChips") {
      const chipAmount = Math.floor(val / 10);
      const coinCost = chipAmount * 10;
      if (convertCoinsToChips(val)) {
        toast.success(`Converted $${coinCost} to ${chipAmount} Chips`);
        setAmount("");
      } else {
        toast.error("Not enough coins!");
      }
    } else {
      const coinAmount = val * 10;
      if (convertChipsToCoins(val)) {
        toast.success(`Converted ${val} Chips to $${coinAmount}`);
        setAmount("");
      } else {
        toast.error("Not enough chips!");
      }
    }
  };

  return (
    <div className="bg-zinc-900/80 p-4 rounded-lg border border-zinc-700 mb-6">
      <h3 className="text-amber-100 font-bold mb-2 flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4" /> Cashier
      </h3>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-black/50 border-zinc-700 text-white"
        />
        <Button 
          onClick={() => handleConvert("toChips")}
          className="bg-emerald-700 hover:bg-emerald-600 text-white"
        >
          Buy Chips
        </Button>
        <Button 
          onClick={() => handleConvert("toCoins")}
          className="bg-amber-700 hover:bg-amber-600 text-white"
        >
          Cash Out
        </Button>
      </div>
      <p className="text-xs text-zinc-500 mt-2">Rate: $10 = 1 Chip</p>
    </div>
  );
}
