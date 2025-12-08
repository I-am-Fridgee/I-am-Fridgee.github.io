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
  hasActed: boolean;
  lastAction: string;
}

interface GameState {
  players: Player[];
  communityCards: PokerCard[];
  pot: number;
  currentPlayer: number;
  gamePhase: "preflop" | "flop" | "turn" | "river" | "showdown" | "ended";
  currentBet: number;
  dealerIndex: number;
}

const SUITS: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const BOT_NAMES = ["Jerry", "Billy", "Faraday"];

const createDeck = (): PokerCard[] => {
  const deck: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const getHandStrength = (cards: PokerCard[]): number => {
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
  const { state: gameState, removeChips, addChips } = useGame();
  const [botCount, setBotCount] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerBet, setPlayerBet] = useState(0);
  const [maxBet, setMaxBet] = useState(100);
  const [gameData, setGameData] = useState<GameState | null>(null);
  const [gameMessage, setGameMessage] = useState("");
  const [waitingForBot, setWaitingForBot] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(false);

  const hasVIP = gameState.upgrades.vipStatus;
  const hasHighRoller = gameState.upgrades.highRoller;

  const startGame = () => {
    if (!hasVIP) {
      toast.error("You need VIP Status to play Poker!");
      return;
    }

    if (gameState.chips < 1000) {
      toast.error("You need at least 1,000 chips to play!");
      return;
    }

    // Deduct entry chips
    removeChips(1000);

    const deck = createDeck();
    let remainingDeck = [...deck];

    // Deal player cards
    const playerCards = remainingDeck.splice(0, 2);

    const players: Player[] = [
      {
        id: 0,
        name: "You",
        chips: 1000,
        hand: playerCards,
        bet: 0,
        folded: false,
        isBot: false,
        hasActed: false,
        lastAction: "",
      },
    ];

    // Add bots
    for (let i = 0; i < botCount; i++) {
      const botCards = remainingDeck.splice(0, 2);
      players.push({
        id: i + 1,
        name: BOT_NAMES[i],
        chips: 1000,
        hand: botCards,
        bet: 0,
        folded: false,
        isBot: true,
        hasActed: false,
        lastAction: "",
      });
    }

    setGameData({
      players,
      communityCards: [],
      pot: 0,
      currentPlayer: 0,
      gamePhase: "preflop",
      currentBet: 0,
      dealerIndex: 0,
    });

    setGameStarted(true);
    setPlayerBet(0);
    setMaxBet(hasHighRoller ? gameState.chips : Math.min(100, gameState.chips));
    setGameMessage("Place your bet!");
  };

  const handlePlayerAction = (action: "fold" | "call" | "raise") => {
    if (!gameData) return;

    const player = gameData.players[0];

    if (action === "fold") {
      player.folded = true;
      player.hasActed = true;
      player.lastAction = "Folded";
      setGameMessage("You folded!");
      removeChips(player.bet);
      
      setTimeout(() => {
        endRound(gameData);
      }, 1000);
      return;
    } else if (action === "call") {
      const callAmount = Math.min(gameData.currentBet - player.bet, player.chips);
      player.bet += callAmount;
      player.chips -= callAmount;
      gameData.pot += callAmount;
      player.hasActed = true;
      player.lastAction = `Called $${callAmount}`;
      setGameMessage(`You called $${callAmount}`);
      removeChips(callAmount);
    } else if (action === "raise") {
      if (playerBet <= gameData.currentBet) {
        toast.error("Raise must be higher than current bet!");
        return;
      }
      const raiseAmount = playerBet - player.bet;
      player.bet = playerBet;
      player.chips -= raiseAmount;
      gameData.pot += raiseAmount;
      gameData.currentBet = playerBet;
      player.hasActed = true;
      player.lastAction = `Raised to $${playerBet}`;
      setGameMessage(`You raised to $${playerBet}`);
      removeChips(raiseAmount);
    }

    setPlayerBet(0);
    setGameData({ ...gameData });
    
    setTimeout(() => {
      simulateBotActions(gameData);
    }, 500);
  };

  const simulateBotActions = (game: GameState) => {
    setWaitingForBot(true);
    
    const botDelay = 1500;
    let delay = 0;

    game.players.forEach((bot, index) => {
      if (bot.isBot && !bot.folded && !bot.hasActed) {
        delay += botDelay;
        
        setTimeout(() => {
          const strength = getHandStrength(bot.hand);
          const rand = Math.random();
          const canBluff = rand < 0.15; // 15% chance to bluff

          // Bluffing logic
          if (canBluff && strength < 4) {
            const bluffAmount = Math.min(Math.floor(Math.random() * 100) + 50, bot.chips);
            bot.bet += bluffAmount;
            bot.chips -= bluffAmount;
            game.pot += bluffAmount;
            game.currentBet = Math.max(game.currentBet, bot.bet);
            bot.lastAction = `Raised to $${bot.bet} (Bluff!)`;
            setGameMessage(`${bot.name} raised to $${bot.bet}!`);
          } else if (strength < 3 && rand < 0.7) {
            bot.folded = true;
            bot.lastAction = "Folded";
            setGameMessage(`${bot.name} folded`);
          } else if (strength < 6 && rand < 0.5) {
            const callAmount = Math.min(game.currentBet - bot.bet, bot.chips);
            bot.bet += callAmount;
            bot.chips -= callAmount;
            game.pot += callAmount;
            bot.lastAction = `Called $${callAmount}`;
            setGameMessage(`${bot.name} called $${callAmount}`);
          } else {
            const raiseAmount = Math.min(Math.floor(Math.random() * 80) + 30, bot.chips);
            bot.bet += raiseAmount;
            bot.chips -= raiseAmount;
            game.pot += raiseAmount;
            game.currentBet = Math.max(game.currentBet, bot.bet);
            bot.lastAction = `Raised to $${bot.bet}`;
            setGameMessage(`${bot.name} raised to $${bot.bet}`);
          }
          
          bot.hasActed = true;
          setGameData({ ...game });
        }, delay);
      }
    });

    setTimeout(() => {
      advancePhase(game);
      setWaitingForBot(false);
    }, delay + 1000);
  };

  const advancePhase = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      endRound(game);
      return;
    }

    setAnimatingCards(true);
    
    setTimeout(() => {
      const deck = createDeck();
      
      if (game.gamePhase === "preflop") {
        game.communityCards = deck.slice(0, 3);
        game.gamePhase = "flop";
        setGameMessage("Flop revealed!");
      } else if (game.gamePhase === "flop") {
        game.communityCards.push(deck[3]);
        game.gamePhase = "turn";
        setGameMessage("Turn revealed!");
      } else if (game.gamePhase === "turn") {
        game.communityCards.push(deck[4]);
        game.gamePhase = "river";
        setGameMessage("River revealed!");
      } else {
        endRound(game);
        return;
      }

      game.players.forEach(p => p.hasActed = false);
      setGameData({ ...game });
      setAnimatingCards(false);
    }, 800);
  };

  const endRound = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += game.pot;
      setGameMessage(`${winner.name} wins $${game.pot}!`);
      
      if (winner.id === 0) {
        addChips(game.pot);
        toast.success(`You won $${game.pot}!`);
      } else {
        toast.error(`${winner.name} won the pot!`);
      }
    }
    
    setTimeout(() => {
      setGameStarted(false);
      setGameData(null);
      setGameMessage("");
    }, 3000);
  };

  if (!hasVIP) {
    return (
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardContent className="p-6 text-center">
          <p className="text-red-200 mb-4 text-xl">🔒 VIP Status Required</p>
          <p className="text-amber-200/60">Purchase VIP Status to unlock Poker!</p>
        </CardContent>
      </Card>
    );
  }

  if (!gameStarted) {
    return (
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <CardTitle className="text-2xl font-display text-amber-200">♠️ Texas Hold'em Poker</CardTitle>
          <CardDescription className="text-amber-200/50">Entry: 1,000 chips • VIP Exclusive</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-amber-100 text-center">Your Chips: <span className="font-bold text-2xl">{gameState.chips.toLocaleString()}</span></p>
          </div>

          <div>
            <label className="text-amber-100 block mb-4 font-semibold">Number of Opponents: {botCount}</label>
            <Slider
              value={[botCount]}
              onValueChange={(value) => setBotCount(value[0])}
              min={1}
              max={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-amber-200/60 mt-2">
              <span>Jerry</span>
              <span>Billy</span>
              <span>Faraday</span>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
            <h3 className="text-amber-100 font-semibold mb-3">Game Rules</h3>
            <ul className="text-amber-200/70 text-sm space-y-1">
              <li>• Each player starts with 1,000 chips</li>
              <li>• Bots can bluff and play strategically</li>
              <li>• Fold, Call, or Raise to win</li>
              <li>• Winner takes the entire pot</li>
              <li>• Betting limit: {hasHighRoller ? "Unlimited" : "100 chips"}</li>
            </ul>
          </div>

          <Button
            onClick={startGame}
            disabled={gameState.chips < 1000}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 text-lg"
          >
            {gameState.chips < 1000 ? "Not Enough Chips" : "Start Game - 1,000 chips"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Poker Table Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 rounded-lg"
        style={{ backgroundImage: "url(/poker-table.png)" }}
      />
      
      <Card className="relative bg-black/60 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-display text-amber-200">♠️ Poker Table</CardTitle>
              <CardDescription className="text-amber-200/50">{gameData?.gamePhase.toUpperCase()}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-sm">Pot</p>
              <div className="flex items-center gap-2">
                <img src="/chip-stack.png" alt="chips" className="w-8 h-8" />
                <p className="text-amber-300 font-bold text-2xl">${gameData?.pot || 0}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Game Message */}
          {gameMessage && (
            <div className="bg-amber-900/40 border border-amber-500/40 p-3 rounded text-amber-100 text-center font-semibold animate-pulse">
              {gameMessage}
            </div>
          )}

          {/* Dealer Section (Top) */}
          <div className="text-center pb-4 border-b border-amber-500/20">
            <div className="flex justify-center items-center gap-3">
              <p className="text-amber-200 font-display text-lg">🎴 Dealer: Fridgee</p>
              <img src="/dealer-deck.png" alt="deck" className="w-16 h-16 rounded" />
            </div>
          </div>

          {/* Bots Section (Sides) */}
          {gameData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {gameData.players.filter(p => p.isBot).map((bot) => (
                <div 
                  key={bot.id}
                  className={`bg-amber-900/20 border ${bot.folded ? 'border-red-500/30 opacity-50' : 'border-amber-500/30'} p-3 rounded-lg`}
                >
                  <p className="text-amber-100 font-semibold">{bot.name}</p>
                  <p className="text-amber-200/70 text-sm">Chips: ${bot.chips}</p>
                  <p className="text-amber-200/70 text-sm">Bet: ${bot.bet}</p>
                  {bot.lastAction && (
                    <p className="text-yellow-300 text-xs mt-1">{bot.lastAction}</p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {!bot.folded && bot.hand.map((_, idx) => (
                      <div key={idx} className="w-8 h-12 bg-blue-900 rounded border border-blue-700 flex items-center justify-center text-xs">
                        🂠
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Community Cards (Center) */}
          {gameData && gameData.communityCards.length > 0 && (
            <div className="bg-green-900/30 border border-amber-500/30 p-4 rounded-lg">
              <p className="text-amber-100 mb-3 font-semibold text-center">Community Cards</p>
              <div className="flex gap-3 justify-center">
                {gameData.communityCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`w-20 h-28 bg-white rounded-lg border-2 border-amber-500 flex flex-col items-center justify-center text-3xl font-bold shadow-lg ${animatingCards ? 'animate-bounce' : ''}`}
                  >
                    <span className={card.suit === "♥" || card.suit === "♦" ? "text-red-600" : "text-black"}>
                      {card.rank}
                    </span>
                    <span className={card.suit === "♥" || card.suit === "♦" ? "text-red-600" : "text-black"}>
                      {card.suit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player Section (Bottom) */}
          {gameData && (
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border-2 border-amber-500/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-amber-100 font-bold text-lg">You</p>
                  <p className="text-amber-200/70">Chips: ${gameData.players[0].chips}</p>
                  <p className="text-amber-200/70">Bet: ${gameData.players[0].bet}</p>
                </div>
                <div className="flex gap-2">
                  {gameData.players[0].hand.map((card, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-28 bg-gradient-to-br from-amber-300 to-amber-600 rounded-lg border-2 border-amber-700 flex flex-col items-center justify-center text-3xl font-bold text-white shadow-xl"
                    >
                      <span>{card.rank}</span>
                      <span>{card.suit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Betting Controls */}
              {!waitingForBot && !gameData.players[0].folded && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-amber-100 block mb-2 font-semibold">Your Bet: ${playerBet}</label>
                    <Slider
                      value={[playerBet]}
                      onValueChange={(value) => setPlayerBet(value[0])}
                      min={0}
                      max={maxBet}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handlePlayerAction("fold")}
                      className="bg-red-600 hover:bg-red-700 font-bold py-3"
                    >
                      Fold
                    </Button>
                    <Button
                      onClick={() => handlePlayerAction("call")}
                      className="bg-amber-600 hover:bg-amber-700 font-bold py-3"
                    >
                      Call
                    </Button>
                    <Button
                      onClick={() => handlePlayerAction("raise")}
                      className="bg-green-600 hover:bg-green-700 font-bold py-3"
                    >
                      Raise
                    </Button>
                  </div>
                </div>
              )}

              {waitingForBot && (
                <div className="text-center py-4">
                  <p className="text-amber-100 animate-pulse">Waiting for other players...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
