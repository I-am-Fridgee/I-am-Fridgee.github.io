import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface Card {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
}

interface Player {
  id: number;
  name: string;
  chips: number;
  hand: Card[];
  bet: number;
  folded: boolean;
  isBot: boolean;
  isDealer: boolean;
}

interface GameState {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentPlayer: number;
  gamePhase: "betting" | "flop" | "turn" | "river" | "showdown" | "ended";
  round: number;
}

const HAND_RANKINGS = [
  { name: "High Card", description: "Highest card in hand" },
  { name: "One Pair", description: "Two cards of same rank" },
  { name: "Two Pair", description: "Two different pairs" },
  { name: "Three of a Kind", description: "Three cards of same rank" },
  { name: "Straight", description: "Five cards in sequence" },
  { name: "Flush", description: "Five cards of same suit" },
  { name: "Full House", description: "Three of a kind + pair" },
  { name: "Four of a Kind", description: "Four cards of same rank" },
  { name: "Straight Flush", description: "Straight + flush" },
  { name: "Royal Flush", description: "A-K-Q-J-10 of same suit" },
];

const SUITS: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const dealCards = (deck: Card[], count: number): [Card[], Card[]] => {
  return [deck.slice(0, count), deck.slice(count)];
};

export default function PokerGame() {
  const { state: gameState, removeCoins, addCoins } = useGame();
  const [botCount, setBotCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerBet, setPlayerBet] = useState(0);
  const [maxBet, setMaxBet] = useState(100);
  const [gameData, setGameData] = useState<GameState | null>(null);
  const [selectedAction, setSelectedAction] = useState<"call" | "raise" | "fold" | null>(null);

  // Check if player can afford to play
  const canPlay = gameState.coins >= 50000;

  const startGame = () => {
    if (!canPlay) {
      toast.error("You need 50,000 coins to play Poker!");
      return;
    }

    // Deduct entry fee
    removeCoins(50000);

    // Initialize game
    const deck = createDeck();
    const [playerCards, remainingDeck] = dealCards(deck, 2);

    const players: Player[] = [
      {
        id: 0,
        name: "You",
        chips: 1000,
        hand: playerCards,
        bet: 0,
        folded: false,
        isBot: false,
        isDealer: false,
      },
    ];

    // Add bots
    for (let i = 0; i < botCount; i++) {
      const [botCards, newDeck] = dealCards(remainingDeck, 2);
      players.push({
        id: i + 1,
        name: `Bot ${i + 1}`,
        chips: 1000,
        hand: botCards,
        bet: 0,
        folded: false,
        isBot: true,
        isDealer: i === botCount - 1,
      });
    }

    setGameData({
      players,
      communityCards: [],
      pot: 0,
      currentPlayer: 0,
      gamePhase: "betting",
      round: 1,
    });

    setGameStarted(true);
    setPlayerBet(0);
    setMaxBet(gameState.upgrades.highRoller ? gameState.chips : Math.min(100, gameState.chips));

  };

  const handleBet = () => {
    if (!gameData || playerBet <= 0 || playerBet > maxBet) {
      toast.error("Invalid bet amount");
      return;
    }

    removeCoins(playerBet);
    setPlayerBet(0);
    toast.success(`Bet $${playerBet}`);
  };

  const handleAction = (action: "call" | "raise" | "fold") => {
    if (!gameData) return;

    if (action === "fold") {
      toast.info("You folded");
      setGameStarted(false);
      addCoins(gameData.pot / 2); // Get back half the pot
    } else if (action === "call") {
      toast.info("You called");
    } else if (action === "raise") {
      toast.info("You raised");
    }

    setSelectedAction(action);
  };

  const endGame = () => {
    setGameStarted(false);
    setGameData(null);
    setSelectedAction(null);
  };

  if (!canPlay && !gameStarted) {
    return (
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardContent className="p-6 text-center">
          <p className="text-amber-200 mb-4">You need 50,000 coins to play Poker!</p>
          <p className="text-amber-200/60 text-sm">Current coins: ${gameState.coins.toLocaleString()}</p>
        </CardContent>
      </Card>
    );
  }

  if (!gameStarted) {
    return (
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <CardTitle className="text-2xl font-display text-amber-200">♠️ Texas Hold'em Poker</CardTitle>
          <CardDescription className="text-amber-200/50">Entry fee: 50,000 coins</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-amber-100 block mb-4">Number of Bots: {botCount}</label>
            <Slider
              value={[botCount]}
              onValueChange={(value) => setBotCount(value[0])}
              min={1}
              max={3}
              step={1}
              className="w-full"
            />
            <p className="text-amber-200/60 text-sm mt-2">Max 3 bots + 1 player</p>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
            <h3 className="text-amber-100 font-semibold mb-3">Hand Rankings (No Odds Shown)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {HAND_RANKINGS.map((hand, idx) => (
                <div key={idx} className="text-amber-200/70">
                  <p className="font-semibold">{hand.name}</p>
                  <p className="text-xs text-amber-200/50">{hand.description}</p>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
          >
            Start Game - 50,000 coins
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
      <CardHeader className="border-b border-amber-500/20 pb-4">
        <CardTitle className="text-2xl font-display text-amber-200">♠️ Poker Game</CardTitle>
        <CardDescription className="text-amber-200/50">Pot: ${gameData?.pot || 0}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Community Cards */}
        {gameData && gameData.communityCards.length > 0 && (
          <div>
            <p className="text-amber-100 mb-2">Community Cards:</p>
            <div className="flex gap-2">
              {gameData.communityCards.map((card, idx) => (
                <div
                  key={idx}
                  className="w-16 h-24 bg-white rounded border-2 border-amber-500 flex items-center justify-center text-2xl font-bold"
                >
                  {card.rank}
                  {card.suit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Hand */}
        {gameData && (
          <div>
            <p className="text-amber-100 mb-2">Your Hand:</p>
            <div className="flex gap-2">
              {gameData.players[0].hand.map((card, idx) => (
                <div
                  key={idx}
                  className="w-16 h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded border-2 border-amber-700 flex items-center justify-center text-2xl font-bold text-white"
                >
                  {card.rank}
                  {card.suit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Betting */}
        {!selectedAction && (
          <div className="space-y-4">
            <div>
              <label className="text-amber-100 block mb-2">Your Bet: ${playerBet}</label>
              <Slider
                value={[playerBet]}
                onValueChange={(value) => setPlayerBet(value[0])}
                min={0}
                max={maxBet}
                step={10}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleAction("fold")}
                className="bg-red-600 hover:bg-red-700"
              >
                Fold
              </Button>
              <Button
                onClick={handleBet}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Call/Check
              </Button>
              <Button
                onClick={() => handleAction("raise")}
                className="bg-green-600 hover:bg-green-700"
              >
                Raise
              </Button>
            </div>
          </div>
        )}

        {selectedAction && (
          <div className="text-center py-4">
            <p className="text-amber-100 mb-4">Waiting for other players...</p>
            <Button
              onClick={endGame}
              className="bg-amber-600 hover:bg-amber-700"
            >
              End Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
