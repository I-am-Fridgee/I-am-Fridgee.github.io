import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface PokerCard {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
}

interface Player {
  id: number;
  name: string;
  chips: number;
  hand: PokerCard[];
  bet: number;
  folded: boolean;
  isBot: boolean;
  isDealer: boolean;
  hasActed: boolean;
}

interface GameState {
  players: Player[];
  communityCards: PokerCard[];
  pot: number;
  currentPlayer: number;
  gamePhase: "betting" | "flop" | "turn" | "river" | "showdown" | "ended";
  round: number;
  minBet: number;
  currentBet: number;
}

const SUITS: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const createDeck = (): PokerCard[] => {
  const deck: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const dealCards = (deck: PokerCard[], count: number): [PokerCard[], PokerCard[]] => {
  return [deck.slice(0, count), deck.slice(count)];
};

const getHandStrength = (cards: PokerCard[]): number => {
  // Simple hand strength calculation (0-10)
  // In real poker, this would be much more complex
  const ranks = cards.map(c => RANKS.indexOf(c.rank));
  const suits = cards.map(c => c.suit);
  
  const hasFlush = suits.filter(s => suits.indexOf(s) !== suits.lastIndexOf(s)).length > 0;
  const hasPair = ranks.filter(r => ranks.indexOf(r) !== ranks.lastIndexOf(r)).length > 0;
  
  let strength = Math.max(...ranks) / 12;
  if (hasPair) strength += 3;
  if (hasFlush) strength += 2;
  
  return Math.min(strength, 10);
};

export default function PokerGame() {
  const { state: gameState, removeCoins, addCoins } = useGame();
  const [botCount, setBotCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerBet, setPlayerBet] = useState(0);
  const [maxBet, setMaxBet] = useState(100);
  const [gameData, setGameData] = useState<GameState | null>(null);
  const [gameMessage, setGameMessage] = useState("");
  const [waitingForBot, setWaitingForBot] = useState(false);

  // Check if player has VIP status
  const hasVIP = gameState.upgrades.vipStatus;

  const startGame = () => {
    if (!hasVIP) {
      toast.error("You need VIP Status to play Poker!");
      return;
    }

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
        hasActed: false,
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
        hasActed: false,
      });
    }

    setGameData({
      players,
      communityCards: [],
      pot: 0,
      currentPlayer: 0,
      gamePhase: "betting",
      round: 1,
      minBet: 10,
      currentBet: 0,
    });

    setGameStarted(true);
    setPlayerBet(0);
    setMaxBet(gameState.upgrades.highRoller ? gameState.chips : Math.min(100, gameState.chips));
    setGameMessage("Place your bet!");
  };

  const handlePlayerAction = (action: "fold" | "call" | "raise") => {
    if (!gameData) return;

    const player = gameData.players[0];
    let newBet = playerBet;

    if (action === "fold") {
      setGameMessage("You folded!");
      gameData.players[0].folded = true;
      gameData.players[0].hasActed = true;
    } else if (action === "call") {
      newBet = Math.min(gameData.currentBet - player.bet, player.chips);
      gameData.players[0].bet += newBet;
      gameData.players[0].chips -= newBet;
      gameData.pot += newBet;
      gameData.players[0].hasActed = true;
      setGameMessage(`You called $${newBet}`);
    } else if (action === "raise") {
      if (playerBet <= gameData.currentBet) {
        toast.error("Raise must be higher than current bet!");
        return;
      }
      const raiseAmount = playerBet - player.bet;
      gameData.players[0].bet = playerBet;
      gameData.players[0].chips -= raiseAmount;
      gameData.pot += raiseAmount;
      gameData.currentBet = playerBet;
      gameData.players[0].hasActed = true;
      setGameMessage(`You raised to $${playerBet}`);
    }

    setPlayerBet(0);
    simulateBotActions(gameData);
  };

  const simulateBotActions = (game: GameState) => {
    setWaitingForBot(true);
    setTimeout(() => {
      game.players.forEach((bot) => {
        if (bot.isBot && !bot.folded && !bot.hasActed) {
          const strength = getHandStrength(bot.hand);
          const rand = Math.random();

          if (strength < 3 && rand < 0.6) {
            bot.folded = true;
            setGameMessage(`${bot.name} folded`);
          } else if (strength < 5 && rand < 0.4) {
            const callAmount = Math.min(game.currentBet - bot.bet, bot.chips);
            bot.bet += callAmount;
            bot.chips -= callAmount;
            game.pot += callAmount;
            setGameMessage(`${bot.name} called`);
          } else {
            const raiseAmount = Math.min(Math.floor(Math.random() * 50) + 20, bot.chips);
            bot.bet += raiseAmount;
            bot.chips -= raiseAmount;
            game.pot += raiseAmount;
            game.currentBet = bot.bet;
            setGameMessage(`${bot.name} raised to $${bot.bet}`);
          }
          bot.hasActed = true;
        }
      });

      // Move to next phase if all players have acted
      const activePlayers = game.players.filter(p => !p.folded);
      if (activePlayers.length === 1) {
        endRound(game);
      } else if (game.gamePhase === "betting") {
        game.gamePhase = "flop";
        const [flop, newDeck] = dealCards(createDeck(), 3);
        game.communityCards = flop;
        game.players.forEach(p => p.hasActed = false);
        setGameMessage("Flop revealed!");
      }

      setGameData({ ...game });
      setWaitingForBot(false);
    }, 1500);
  };

  const endRound = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
      activePlayers[0].chips += game.pot;
      setGameMessage(`${activePlayers[0].name} wins $${game.pot}!`);
      
      if (activePlayers[0].id === 0) {
        addCoins(game.pot);
      }
    }
    
    setTimeout(() => {
      setGameStarted(false);
      setGameData(null);
      setGameMessage("");
    }, 2000);
  };

  if (!hasVIP && !gameStarted) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="p-6 text-center">
          <p className="text-red-200 mb-4">🔒 VIP Status Required</p>
          <p className="text-amber-200/60 text-sm">Purchase VIP Status to unlock Poker!</p>
        </CardContent>
      </Card>
    );
  }

  if (!gameStarted) {
    return (
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <CardTitle className="text-2xl font-display text-amber-200">♠️ Texas Hold'em Poker</CardTitle>
          <CardDescription className="text-amber-200/50">VIP Exclusive Game</CardDescription>
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
            <p className="text-amber-200/60 text-sm mt-2">Play against 1-3 bots</p>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
            <h3 className="text-amber-100 font-semibold mb-3">Game Rules</h3>
            <ul className="text-amber-200/70 text-sm space-y-1">
              <li>• Each player starts with 1,000 chips</li>
              <li>• Bots play randomly based on hand strength</li>
              <li>• Fold, Call, or Raise your way to victory</li>
              <li>• Winner takes the pot</li>
              <li>• Betting limit: 100 chips (or unlimited with High Roller)</li>
            </ul>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3"
          >
            Start Game
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
        {/* Game Message */}
        {gameMessage && (
          <div className="bg-amber-900/30 border border-amber-500/30 p-3 rounded text-amber-100 text-center">
            {gameMessage}
          </div>
        )}

        {/* Community Cards */}
        {gameData && gameData.communityCards.length > 0 && (
          <div>
            <p className="text-amber-100 mb-2 font-semibold">Community Cards:</p>
            <div className="flex gap-2 flex-wrap">
              {gameData.communityCards.map((card, idx) => (
                <div
                  key={idx}
                  className="w-16 h-24 bg-white rounded border-2 border-amber-500 flex items-center justify-center text-xl font-bold"
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
            <p className="text-amber-100 mb-2 font-semibold">Your Hand:</p>
            <div className="flex gap-2">
              {gameData.players[0].hand.map((card, idx) => (
                <div
                  key={idx}
                  className="w-16 h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded border-2 border-amber-700 flex items-center justify-center text-xl font-bold text-white"
                >
                  {card.rank}
                  {card.suit}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Players Status */}
        {gameData && (
          <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded">
            <p className="text-amber-100 font-semibold mb-2">Players:</p>
            <div className="space-y-1 text-sm">
              {gameData.players.map((p) => (
                <div key={p.id} className="text-amber-200/70">
                  {p.name}: {p.chips} chips {p.folded && "(folded)"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Betting */}
        {!waitingForBot && gameData && !gameData.players[0].folded && (
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
                onClick={() => handlePlayerAction("fold")}
                className="bg-red-600 hover:bg-red-700"
              >
                Fold
              </Button>
              <Button
                onClick={() => handlePlayerAction("call")}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Call
              </Button>
              <Button
                onClick={() => handlePlayerAction("raise")}
                className="bg-green-600 hover:bg-green-700"
              >
                Raise
              </Button>
            </div>
          </div>
        )}

        {waitingForBot && (
          <div className="text-center py-4">
            <p className="text-amber-100">Bots are playing...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
