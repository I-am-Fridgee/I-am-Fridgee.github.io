import { useGame } from "@/contexts/GameContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Card = { suit: string; value: string; score: number };

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export default function BlackjackGame() {
  const { state, removeChips, addChips } = useGame();
  const [bet, setBet] = useState("");
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [message, setMessage] = useState("");
  const [animateNewCard, setAnimateNewCard] = useState(false);

  const getDeck = () => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        let score = parseInt(value);
        if (["J", "Q", "K"].includes(value)) score = 10;
        if (value === "A") score = 11;
        deck.push({ suit, value, score });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const [deck, setDeck] = useState<Card[]>([]);

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.score, 0);
    let aces = hand.filter((c) => c.value === "A").length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const startGame = () => {
    const betAmount = parseInt(bet);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast.error("Invalid bet amount");
      return;
    }
    if (state.chips < betAmount) {
      toast.error("Not enough chips!");
      return;
    }

    if (removeChips(betAmount)) {
      const newDeck = getDeck();
      setDeck(newDeck);
      setGameState("playing");
      setMessage("");
      
      // Deal initial cards with animation
      const pHand = [newDeck.pop()!, newDeck.pop()!];
      const dHand = [newDeck.pop()!, newDeck.pop()!];
      setPlayerHand(pHand);
      setDealerHand(dHand);
      setAnimateNewCard(true);
      
      // Check instant Blackjack
      setTimeout(() => {
        setAnimateNewCard(false);
        if (calculateScore(pHand) === 21) {
          setTimeout(() => endGame(pHand, dHand, betAmount * 2.5), 500);
        }
      }, 800);
    }
  };

  const hit = () => {
    setAnimateNewCard(true);
    const newHand = [...playerHand, deck.pop()!];
    setPlayerHand(newHand);
    
    setTimeout(() => {
      setAnimateNewCard(false);
      if (calculateScore(newHand) > 21) {
        endGame(newHand, dealerHand, 0);
      }
    }, 400);
  };

  const stand = () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(currentDealerHand);
    
    // Improved dealer logic: if already winning, don't risk
    if (dealerScore > playerScore && dealerScore <= 21) {
      // Dealer already winning, no need to hit
      const betAmount = parseInt(bet);
      endGame(playerHand, currentDealerHand, 0);
      return;
    }
    
    // Dealer plays by standard rules: hit on 16 or less, stand on 17+
    const dealerDrawCards = () => {
      if (calculateScore(currentDealerHand) < 17) {
        setAnimateNewCard(true);
        currentDealerHand.push(currentDeck.pop()!);
        setDealerHand([...currentDealerHand]);
        
        setTimeout(() => {
          setAnimateNewCard(false);
          setTimeout(dealerDrawCards, 200);
        }, 400);
      } else {
        // Dealer done
        setDeck(currentDeck);
        
        const pScore = calculateScore(playerHand);
        const dScore = calculateScore(currentDealerHand);
        const betAmount = parseInt(bet);

        let winnings = 0;
        if (dScore > 21 || pScore > dScore) {
          winnings = betAmount * 2;
        } else if (pScore === dScore) {
          winnings = betAmount; // Push
        }

        endGame(playerHand, currentDealerHand, winnings);
      }
    };
    
    dealerDrawCards();
  };

  const endGame = (pHand: Card[], dHand: Card[], winnings: number) => {
    setGameState("finished");
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (pScore > 21) {
      setMessage("Bust! You lost.");
    } else if (dScore > 21) {
      setMessage("Dealer Bust! You Win!");
      addChips(winnings);
    } else if (pScore > dScore) {
      setMessage("You Win!");
      addChips(winnings);
    } else if (pScore < dScore) {
      setMessage("Dealer Wins.");
    } else {
      setMessage("Push (Tie). Chips returned.");
      addChips(winnings);
    }
  };

  const CardView = ({ card, hidden, shouldAnimate }: { card: Card; hidden?: boolean; shouldAnimate?: boolean }) => (
    <motion.div 
      initial={shouldAnimate ? { x: -100, y: -50, opacity: 0, rotate: -20 } : false}
      animate={shouldAnimate ? { x: 0, y: 0, opacity: 1, rotate: 0 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={`
        w-16 h-24 rounded-lg flex items-center justify-center text-xl font-bold border-2 shadow-md
        ${hidden 
          ? "bg-red-900 border-white/20" 
          : "bg-white text-black border-zinc-300"
        }
      `}
    >
      {!hidden && (
        <div className={["♥", "♦"].includes(card.suit) ? "text-red-600" : "text-black"}>
          {card.value}{card.suit}
        </div>
      )}
    </motion.div>
  );

  return (
    <div 
      className="relative bg-emerald-900/80 p-6 rounded-xl border-8 border-amber-900 shadow-2xl overflow-hidden"
      style={{
        backgroundImage: "url('/images/blackjack_table.jpg')",
        backgroundSize: "cover",
        backgroundBlendMode: "multiply"
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-2xl font-display font-bold text-amber-100 drop-shadow-md">Blackjack</h3>
        </div>

        {/* Dealer Area */}
        <div className="flex flex-col items-center mb-8 min-h-[120px]">
          <div className="text-xs uppercase tracking-widest text-emerald-200/50 mb-2">Dealer</div>
          <div className="flex gap-2">
            {dealerHand.map((card, i) => (
              <CardView 
                key={`dealer-${i}`} 
                card={card} 
                hidden={gameState === "playing" && i === 1} 
                shouldAnimate={animateNewCard && i === dealerHand.length - 1}
              />
            ))}
            {dealerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg" />}
          </div>
          {gameState === "finished" && (
            <div className="mt-2 text-sm font-bold text-white">{calculateScore(dealerHand)}</div>
          )}
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center mb-8 min-h-[120px]">
          <div className="text-xs uppercase tracking-widest text-emerald-200/50 mb-2">You</div>
          <div className="flex gap-2">
            {playerHand.map((card, i) => (
              <CardView 
                key={`player-${i}`} 
                card={card} 
                shouldAnimate={animateNewCard && i === playerHand.length - 1}
              />
            ))}
            {playerHand.length === 0 && <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg" />}
          </div>
          {playerHand.length > 0 && (
            <div className="mt-2 text-sm font-bold text-white">{calculateScore(playerHand)}</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          {gameState === "idle" || gameState === "finished" ? (
            <div className="flex gap-2 w-full max-w-xs">
              <Input
                type="number"
                placeholder="Bet Chips"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="bg-black/60 border-emerald-500/30 text-white"
              />
              <Button onClick={startGame} className="bg-amber-600 hover:bg-amber-500 text-white font-bold">
                DEAL
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Button onClick={hit} className="bg-emerald-600 hover:bg-emerald-500 w-24">HIT</Button>
              <Button onClick={stand} className="bg-red-600 hover:bg-red-500 w-24">STAND</Button>
            </div>
          )}
          
          {message && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-black/80 px-6 py-2 rounded-full text-amber-400 font-bold border border-amber-500/50"
            >
              {message}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
