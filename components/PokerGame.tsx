import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface PokerCard {
  suit: "♠" | "♥" | "♦" | "♣";
  rank: string;
  value: number;
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
  isAllIn: boolean;
}

interface GameState {
  players: Player[];
  communityCards: PokerCard[];
  pot: number;
  currentPlayer: number;
  gamePhase: "preflop" | "flop" | "turn" | "river" | "showdown" | "ended";
  currentBet: number;
  dealerIndex: number;
  deck: PokerCard[];
  smallBlind: number;
  bigBlind: number;
  sidePots: { amount: number; eligiblePlayers: number[] }[];
}

const SUITS: ("♠" | "♥" | "♦" | "♣")[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUES: { [key: string]: number } = {
  "2": 0, "3": 1, "4": 2, "5": 3, "6": 4, "7": 5, "8": 6, 
  "9": 7, "10": 8, "J": 9, "Q": 10, "K": 11, "A": 12
};

// Adjusted bot configs - less folding, more reasonable play
const BOT_CONFIGS = [
  { name: "Jerry", maxChips: 25000, aggression: 0.4, tightness: 0.4, bluffChance: 0.15 },
  { name: "Billy", maxChips: 100000, aggression: 0.7, tightness: 0.3, bluffChance: 0.2 },
  { name: "Faraday", maxChips: 1000000, aggression: 0.8, tightness: 0.2, bluffChance: 0.25 },
];

enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

interface HandResult {
  rank: HandRank;
  value: number;
  cards: PokerCard[];
  kickers: number[];
}

const createDeck = (): PokerCard[] => {
  const deck: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ 
        suit, 
        rank, 
        value: RANK_VALUES[rank] 
      });
    }
  }
  return deck;
};

const shuffleDeck = (deck: PokerCard[]): PokerCard[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

const evaluateHand = (cards: PokerCard[]): HandResult => {
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  const rankCounts: { [key: number]: number } = {};
  const suitCounts: { [key: string]: number } = {};
  const values: number[] = [];
  
  sortedCards.forEach(card => {
    rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
    suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    values.push(card.value);
  });
  
  const flushSuit = Object.keys(suitCounts).find(suit => suitCounts[suit] >= 5);
  const flushCards = flushSuit ? sortedCards.filter(c => c.suit === flushSuit) : [];
  
  const checkStraight = (cards: PokerCard[]): PokerCard[] | null => {
    const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
    
    if (uniqueValues.includes(12) && uniqueValues.includes(0) && 
        uniqueValues.includes(1) && uniqueValues.includes(2) && uniqueValues.includes(3)) {
      return cards.filter(c => [12, 0, 1, 2, 3].includes(c.value))
                  .sort((a, b) => b.value - a.value);
    }
    
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        return cards.filter(c => uniqueValues.slice(i, i + 5).includes(c.value));
      }
    }
    return null;
  };
  
  if (flushSuit) {
    const straightFlushCards = checkStraight(flushCards);
    if (straightFlushCards) {
      const isRoyal = straightFlushCards[0].value === 12 && straightFlushCards[4].value === 8;
      return {
        rank: isRoyal ? HandRank.ROYAL_FLUSH : HandRank.STRAIGHT_FLUSH,
        value: straightFlushCards[0].value,
        cards: straightFlushCards.slice(0, 5),
        kickers: []
      };
    }
  }
  
  const quadsValue = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 4);
  if (quadsValue) {
    const quadVal = parseInt(quadsValue);
    const kicker = Math.max(...values.filter(v => v !== quadVal));
    return {
      rank: HandRank.FOUR_OF_A_KIND,
      value: quadVal,
      cards: sortedCards.filter(c => c.value === quadVal).slice(0, 4),
      kickers: [kicker]
    };
  }
  
  const tripleValues = Object.keys(rankCounts).filter(r => rankCounts[parseInt(r)] === 3).map(Number).sort((a, b) => b - a);
  const pairValues = Object.keys(rankCounts).filter(r => rankCounts[parseInt(r)] >= 2).map(Number).sort((a, b) => b - a);
  
  if (tripleValues.length >= 2 || (tripleValues.length === 1 && pairValues.length >= 2)) {
    const tripleVal = tripleValues[0];
    const pairVal = tripleValues.length >= 2 ? tripleValues[1] : 
                   pairValues.find(v => v !== tripleVal) || 0;
    return {
      rank: HandRank.FULL_HOUSE,
      value: tripleVal,
      cards: sortedCards.filter(c => c.value === tripleVal || c.value === pairVal).slice(0, 5),
      kickers: [pairVal]
    };
  }
  
  if (flushSuit && flushCards.length >= 5) {
    return {
      rank: HandRank.FLUSH,
      value: flushCards[0].value,
      cards: flushCards.slice(0, 5),
      kickers: []
    };
  }
  
  const straightCards = checkStraight(sortedCards);
  if (straightCards) {
    return {
      rank: HandRank.STRAIGHT,
      value: straightCards[0].value,
      cards: straightCards.slice(0, 5),
      kickers: []
    };
  }
  
  if (tripleValues.length > 0) {
    const tripleVal = tripleValues[0];
    const kickers = values.filter(v => v !== tripleVal)
                         .sort((a, b) => b - a)
                         .slice(0, 2);
    return {
      rank: HandRank.THREE_OF_A_KIND,
      value: tripleVal,
      cards: sortedCards.filter(c => c.value === tripleVal).slice(0, 3),
      kickers
    };
  }
  
  if (pairValues.length >= 2) {
    const pair1 = pairValues[0];
    const pair2 = pairValues[1];
    const kicker = values.filter(v => v !== pair1 && v !== pair2)
                        .sort((a, b) => b - a)[0];
    return {
      rank: HandRank.TWO_PAIR,
      value: Math.max(pair1, pair2),
      cards: sortedCards.filter(c => c.value === pair1 || c.value === pair2).slice(0, 4),
      kickers: [kicker]
    };
  }
  
  if (pairValues.length === 1) {
    const pairVal = pairValues[0];
    const kickers = values.filter(v => v !== pairVal)
                         .sort((a, b) => b - a)
                         .slice(0, 3);
    return {
      rank: HandRank.PAIR,
      value: pairVal,
      cards: sortedCards.filter(c => c.value === pairVal).slice(0, 2),
      kickers
    };
  }
  
  return {
    rank: HandRank.HIGH_CARD,
    value: values[0],
    cards: sortedCards.slice(0, 5),
    kickers: values.slice(1, 5)
  };
};

const compareHands = (hand1: HandResult, hand2: HandResult): number => {
  if (hand1.rank !== hand2.rank) {
    return hand2.rank - hand1.rank;
  }
  
  if (hand1.value !== hand2.value) {
    return hand2.value - hand1.value;
  }
  
  for (let i = 0; i < Math.max(hand1.kickers.length, hand2.kickers.length); i++) {
    const k1 = hand1.kickers[i] || 0;
    const k2 = hand2.kickers[i] || 0;
    if (k1 !== k2) return k2 - k1;
  }
  
  return 0;
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
  const [revealingCards, setRevealingCards] = useState(false);
  const [showdownWinner, setShowdownWinner] = useState<Player | null>(null);
  const [revealedHands, setRevealedHands] = useState<{[key: number]: boolean}>({});

  const hasVIP = gameState.upgrades.vipStatus;
  const hasHighRoller = gameState.upgrades.highRoller;

  const startGame = () => {
    if (!hasVIP) {
      toast.error("You need VIP Status to play Poker!");
      return;
    }

    if (gameState.chips < 100) {
      toast.error("You need at least 100 chips to play!");
      return;
    }

    const deck = shuffleDeck(createDeck());
    const playerCards = [deck.pop()!, deck.pop()!];

    const players: Player[] = [
      {
        id: 0,
        name: "You",
        chips: gameState.chips,
        hand: playerCards,
        bet: 0,
        folded: false,
        isBot: false,
        hasActed: false,
        lastAction: "",
        isAllIn: false,
      },
    ];

    for (let i = 0; i < botCount; i++) {
      const botConfig = BOT_CONFIGS[i];
      const botCards = [deck.pop()!, deck.pop()!];
      players.push({
        id: i + 1,
        name: botConfig.name,
        chips: botConfig.maxChips,
        hand: botCards,
        bet: 0,
        folded: false,
        isBot: true,
        hasActed: false,
        lastAction: "",
        isAllIn: false,
      });
    }

    const smallBlind = hasHighRoller ? 50 : 10;
    const bigBlind = smallBlind * 2;

    const dealerIndex = 0;
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;
    
    // Post small blind
    players[smallBlindIndex].bet = smallBlind;
    players[smallBlindIndex].chips -= smallBlind;
    players[smallBlindIndex].lastAction = `Small blind $${smallBlind}`;
    if (smallBlindIndex === 0) removeChips(smallBlind);
    
    // Post big blind
    players[bigBlindIndex].bet = bigBlind;
    players[bigBlindIndex].chips -= bigBlind;
    players[bigBlindIndex].lastAction = `Big blind $${bigBlind}`;
    if (bigBlindIndex === 0) removeChips(bigBlind);

    players[smallBlindIndex].hasActed = false;
    players[bigBlindIndex].hasActed = false;

    let initialBetValue = bigBlind * 2;
    
    const initialPot = smallBlind + bigBlind;
    const firstToAct = (bigBlindIndex + 1) % players.length;

    setGameData({
      players,
      communityCards: [],
      pot: initialPot,
      currentPlayer: firstToAct,
      gamePhase: "preflop",
      currentBet: bigBlind,
      dealerIndex,
      deck,
      smallBlind,
      bigBlind,
      sidePots: []
    });

    setGameStarted(true);
    setPlayerBet(initialBetValue);
    setMaxBet(hasHighRoller ? gameState.chips : Math.min(1000, gameState.chips));
    setGameMessage(`Blinds posted: $${smallBlind}/$${bigBlind}`);
    setRevealedHands({});
    setShowdownWinner(null);
  };

  const calculateBotBet = (bot: Player, game: GameState): { action: "fold" | "call" | "raise"; amount: number } => {
    const botConfig = BOT_CONFIGS.find(b => b.name === bot.name);
    if (!botConfig) return { action: "fold", amount: 0 };
    
    // Evaluate hand with community cards
    const allCards = [...bot.hand, ...game.communityCards];
    const handResult = evaluateHand(allCards);
    
    // Normalized strength (0-1)
    let strength = (handResult.rank * 100 + handResult.value) / 1000;
    
    // Adjust strength based on number of community cards
    if (game.communityCards.length === 0) {
      // Pre-flop: Only have hole cards
      const highCard = Math.max(bot.hand[0].value, bot.hand[1].value);
      const isPair = bot.hand[0].value === bot.hand[1].value;
      const suited = bot.hand[0].suit === bot.hand[1].suit;
      const connected = Math.abs(bot.hand[0].value - bot.hand[1].value) <= 2;
      
      strength = (highCard / 12) * 0.5;
      if (isPair) strength += 0.3;
      if (suited) strength += 0.1;
      if (connected) strength += 0.1;
    }
    
    const aggression = botConfig.aggression;
    const tightness = botConfig.tightness;
    const bluffChance = botConfig.bluffChance;
    const rand = Math.random();
    const bluffing = rand < bluffChance;
    
    const callAmount = game.currentBet - bot.bet;
    const potOdds = callAmount / (game.pot + callAmount);
    
    // Bots fold less often - only with very weak hands
    if (strength < 0.15 && rand < 0.3 * tightness && !bluffing) {
      return { action: "fold", amount: 0 };
    }
    
    // Bluffing logic
    if (bluffing && strength < 0.5 && rand < 0.5) {
      const bluffRaise = Math.min(
        Math.max(callAmount * 1.5, game.bigBlind * 1.5),
        bot.chips * 0.1
      );
      return { action: "raise", amount: bot.bet + bluffRaise };
    }
    
    // Weak hand - might call small bets or fold
    if (strength < 0.3) {
      if (callAmount < game.bigBlind && rand < 0.4) {
        return { action: "call", amount: callAmount };
      }
      if (callAmount === 0) {
        return { action: "call", amount: 0 }; // Check
      }
      if (rand < 0.3) {
        return { action: "fold", amount: 0 };
      }
      return { action: "call", amount: callAmount };
    }
    
    // Medium hand - call or small raise
    if (strength < 0.6) {
      if (rand < 0.5 * aggression) {
        const raiseAmount = Math.min(
          Math.max(callAmount * 1.8, game.bigBlind * 1.5),
          bot.chips * 0.15
        );
        return { action: "raise", amount: bot.bet + raiseAmount };
      }
      if (callAmount < bot.chips * 0.2) {
        return { action: "call", amount: callAmount };
      }
      return { action: "fold", amount: 0 };
    }
    
    // Strong hand - raise more aggressively
    const raiseMultiplier = 2 + (strength * 1.5) + (aggression * 1.5);
    const raiseAmount = Math.min(
      Math.max(callAmount * raiseMultiplier, game.bigBlind * 2),
      bot.chips * (0.2 + strength * 0.3)
    );
    return { action: "raise", amount: bot.bet + raiseAmount };
  };

  const handlePlayerAction = (action: "fold" | "call" | "raise") => {
    if (!gameData) return;

    const player = gameData.players[0];
    let betChange = 0;
    let newMessage = "";

    if (action === "fold") {
      player.folded = true;
      player.hasActed = true;
      player.lastAction = "Folded";
      newMessage = "You folded!";
      
      // Check if all bots folded
      const activePlayers = gameData.players.filter(p => !p.folded);
      if (activePlayers.length === 1 && activePlayers[0].isBot) {
        // All bots folded, player wins by default
        const winner = activePlayers[0];
        winner.chips += gameData.pot;
        if (winner.id === 0) {
          addChips(gameData.pot);
          toast.success(`You won $${gameData.pot.toLocaleString()}!`);
        }
        setGameMessage(`${winner.name} wins $${gameData.pot.toLocaleString()}!`);
        
        setTimeout(() => {
          endRound(gameData);
        }, 2000);
        return;
      }
      
      // If player folds and there are still active players, continue game
      setGameMessage(newMessage);
      
      // Check if betting round is complete
      checkAndAdvanceGame(gameData);
      return;
      
    } else if (action === "call") {
      const callAmount = Math.min(gameData.currentBet - player.bet, gameState.chips);
      if (callAmount > gameState.chips) {
        toast.error("Not enough chips!");
        return;
      }
      betChange = callAmount;
      player.bet += callAmount;
      gameData.pot += callAmount;
      player.lastAction = callAmount === 0 ? "Checked" : `Called $${callAmount}`;
      newMessage = callAmount === 0 ? "You checked" : `You called $${callAmount}`;
      if (callAmount > 0) removeChips(callAmount);
      
      if (callAmount === gameState.chips) {
        player.isAllIn = true;
        player.lastAction = "All-in!";
      }
      
      player.hasActed = true;
      
    } else if (action === "raise") {
      if (playerBet <= gameData.currentBet && gameData.currentBet > 0) {
        toast.error("Raise must be higher than current bet!");
        return;
      }
      const raiseAmount = playerBet - player.bet;
      if (raiseAmount > gameState.chips) {
        toast.error("Not enough chips to raise that amount!");
        return;
      }
      betChange = raiseAmount;
      player.bet = playerBet;
      gameData.pot += raiseAmount;
      gameData.currentBet = playerBet;
      player.lastAction = `Raised to $${playerBet}`;
      newMessage = `You raised to $${playerBet}`;
      removeChips(raiseAmount);
      player.hasActed = true;
      
      if (raiseAmount === gameState.chips) {
        player.isAllIn = true;
        player.lastAction = "All-in!";
      }
    }

    if (newMessage) {
      setGameMessage(newMessage);
    }

    // Update player's chips in game state
    player.chips = gameState.chips - betChange;
    
    // Check if betting round is complete
    checkAndAdvanceGame(gameData);
    
    setPlayerBet(0);
    setGameData({ ...gameData });
  };

  const checkAndAdvanceGame = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    
    // If only one player remains, they win immediately
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += game.pot;
      
      if (winner.id === 0) {
        addChips(game.pot);
        toast.success(`You won $${game.pot.toLocaleString()} by default!`);
        setGameMessage(`All opponents folded! You win $${game.pot.toLocaleString()}!`);
      } else {
        toast.error(`${winner.name} won the pot!`);
        setGameMessage(`${winner.name} wins $${game.pot.toLocaleString()}!`);
      }
      
      setTimeout(() => {
        endRound(game);
      }, 2000);
      return;
    }
    
    const nonAllInPlayers = activePlayers.filter(p => !p.isAllIn);
    const allActed = nonAllInPlayers.every(p => p.hasActed) && 
                    nonAllInPlayers.every(p => p.bet === game.currentBet || p.isAllIn);
    
    if (allActed || nonAllInPlayers.length <= 1) {
      setTimeout(() => {
        advancePhase(game);
      }, 1000);
    } else {
      // Move to next player
      let nextPlayer = (game.currentPlayer + 1) % game.players.length;
      while (game.players[nextPlayer].folded || game.players[nextPlayer].isAllIn || 
             (nextPlayer === 0 && game.players[0].hasActed)) {
        nextPlayer = (nextPlayer + 1) % game.players.length;
      }
      game.currentPlayer = nextPlayer;
      setGameData({ ...game });
      
      if (game.players[nextPlayer].isBot) {
        setTimeout(() => {
          simulateBotAction(game);
        }, 500);
      } else {
        // Player's turn - update bet slider
        const minRaise = Math.max(game.currentBet * 2, game.bigBlind * 2);
        setPlayerBet(Math.max(minRaise, game.currentBet));
      }
    }
  };

  const simulateBotAction = (game: GameState) => {
    setWaitingForBot(true);
    
    setTimeout(() => {
      const bot = game.players[game.currentPlayer];
      const decision = calculateBotBet(bot, game);
      
      let betChange = 0;
      let message = "";
      
      if (decision.action === "fold") {
        bot.folded = true;
        bot.lastAction = "Folded";
        message = `${bot.name} folded`;
        
        // Check if all bots folded
        const activePlayers = game.players.filter(p => !p.folded);
        if (activePlayers.length === 1 && !activePlayers[0].isBot) {
          // Player wins by default
          const winner = activePlayers[0];
          winner.chips += game.pot;
          addChips(game.pot);
          toast.success(`All bots folded! You win $${game.pot.toLocaleString()}!`);
          setGameMessage(`All opponents folded! You win $${game.pot.toLocaleString()}!`);
          
          setTimeout(() => {
            endRound(game);
          }, 2000);
          return;
        }
        
      } else if (decision.action === "call") {
        const callAmount = Math.min(decision.amount, bot.chips);
        betChange = callAmount;
        bot.bet += callAmount;
        bot.chips -= callAmount;
        game.pot += callAmount;
        bot.lastAction = callAmount === 0 ? "Checked" : `Called $${callAmount}`;
        message = `${bot.name} ${callAmount === 0 ? "checked" : `called $${callAmount}`}`;
        
        if (callAmount === bot.chips) {
          bot.isAllIn = true;
          bot.lastAction = "All-in!";
        }
      } else if (decision.action === "raise") {
        const raiseAmount = Math.min(decision.amount - bot.bet, bot.chips);
        betChange = raiseAmount;
        bot.bet = decision.amount;
        bot.chips -= raiseAmount;
        game.pot += raiseAmount;
        game.currentBet = decision.amount;
        bot.lastAction = `Raised to $${decision.amount}`;
        message = `${bot.name} raised to $${decision.amount}`;
        
        if (raiseAmount === bot.chips) {
          bot.isAllIn = true;
          bot.lastAction = "All-in!";
        }
      }
      
      bot.hasActed = true;
      
      if (message) {
        setGameMessage(message);
      }
      
      // Check and advance game
      checkAndAdvanceGame(game);
      
      setGameData({ ...game });
      setWaitingForBot(false);
    }, 1500);
  };

  const advancePhase = (game: GameState) => {
    // Reset acted status for new round
    game.players.forEach(p => {
      if (!p.isAllIn) {
        p.hasActed = false;
        p.bet = 0;
      }
    });
    
    game.currentBet = 0;
    
    // Determine first player for next round
    const activePlayers = game.players.filter(p => !p.folded);
    let firstPlayer = game.dealerIndex;
    do {
      firstPlayer = (firstPlayer + 1) % game.players.length;
    } while (game.players[firstPlayer].folded || game.players[firstPlayer].isAllIn);
    game.currentPlayer = firstPlayer;
    
    setAnimatingCards(true);
    
    setTimeout(() => {
      if (game.gamePhase === "preflop") {
        game.communityCards = [game.deck.pop()!, game.deck.pop()!, game.deck.pop()!];
        game.gamePhase = "flop";
        setGameMessage("Flop revealed!");
      } else if (game.gamePhase === "flop") {
        game.communityCards.push(game.deck.pop()!);
        game.gamePhase = "turn";
        setGameMessage("Turn revealed!");
      } else if (game.gamePhase === "turn") {
        game.communityCards.push(game.deck.pop()!);
        game.gamePhase = "river";
        setGameMessage("River revealed!");
      } else if (game.gamePhase === "river") {
        game.gamePhase = "showdown";
        startShowdown(game);
        return;
      }
      
      // If player is next, set their bet slider
      if (game.currentPlayer === 0) {
        const minRaise = Math.max(game.currentBet * 2, game.bigBlind * 2);
        setPlayerBet(Math.max(minRaise, game.currentBet));
      }
      
      setGameData({ ...game });
      setAnimatingCards(false);
      
      // If next player is bot, start bot action
      if (game.players[game.currentPlayer].isBot) {
        setTimeout(() => {
          simulateBotAction(game);
        }, 1000);
      }
    }, 800);
  };

  const calculateSidePots = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    const bets = activePlayers.map(p => p.bet).sort((a, b) => a - b);
    const uniqueBets = [...new Set(bets)];
    
    const sidePots = [];
    let previousBet = 0;
    
    for (const bet of uniqueBets) {
      const amount = (bet - previousBet) * activePlayers.filter(p => p.bet >= bet).length;
      const eligiblePlayers = activePlayers.filter(p => p.bet >= bet).map(p => p.id);
      
      if (amount > 0) {
        sidePots.push({ amount, eligiblePlayers });
      }
      previousBet = bet;
    }
    
    return sidePots;
  };

  const startShowdown = (game: GameState) => {
    setRevealingCards(true);
    setGameMessage("Showdown! Revealing cards...");
    
    game.sidePots = calculateSidePots(game);
    
    const activePlayers = game.players.filter(p => !p.folded);
    
    let delay = 0;
    const revealDelay = 1000;
    
    activePlayers.forEach((player, index) => {
      setTimeout(() => {
        setRevealedHands(prev => ({
          ...prev,
          [player.id]: true
        }));
        
        if (index === activePlayers.length - 1) {
          setTimeout(() => {
            determineShowdownWinner(game);
          }, 500);
        }
      }, delay);
      
      delay += revealDelay;
    });
  };

  const determineShowdownWinner = (game: GameState) => {
    const activePlayers = game.players.filter(p => !p.folded);
    
    const playerHands = activePlayers.map(player => ({
      player,
      handResult: evaluateHand([...player.hand, ...game.communityCards])
    }));
    
    playerHands.sort((a, b) => compareHands(b.handResult, a.handResult));
    
    const winners: typeof playerHands = [];
    const winningHand = playerHands[0].handResult;
    
    for (const ph of playerHands) {
      if (compareHands(ph.handResult, winningHand) === 0) {
        winners.push(ph);
      } else {
        break;
      }
    }
    
    let totalWon = 0;
    
    for (const sidePot of game.sidePots) {
      const eligibleWinners = winners.filter(w => 
        sidePot.eligiblePlayers.includes(w.player.id)
      );
      
      if (eligibleWinners.length > 0) {
        const splitAmount = Math.floor(sidePot.amount / eligibleWinners.length);
        
        for (const winner of eligibleWinners) {
          winner.player.chips += splitAmount;
          totalWon += splitAmount;
          
          if (winner.player.id === 0) {
            addChips(splitAmount);
          }
        }
      }
    }
    
    const mainPotWinners = winners.filter(w => !game.sidePots.some(sp => 
      sp.eligiblePlayers.includes(w.player.id)
    ));
    
    if (mainPotWinners.length > 0) {
      const splitAmount = Math.floor(game.pot / mainPotWinners.length);
      
      for (const winner of mainPotWinners) {
        winner.player.chips += splitAmount;
        totalWon += splitAmount;
        
        if (winner.player.id === 0) {
          addChips(splitAmount);
        }
      }
    }
    
    if (winners.length === 1) {
      setShowdownWinner(winners[0].player);
      setGameMessage(`${winners[0].player.name} wins $${totalWon.toLocaleString()}!`);
      
      if (winners[0].player.id === 0) {
        toast.success(`You won $${totalWon.toLocaleString()}!`);
      } else {
        toast.error(`${winners[0].player.name} won the pot!`);
      }
    } else {
      setGameMessage(`${winners.length}-way tie! Each gets $${Math.floor(totalWon / winners.length).toLocaleString()}`);
      toast.info(`Split pot between ${winners.map(w => w.player.name).join(', ')}`);
    }
    
    setTimeout(() => {
      endRound(game);
    }, 4000);
  };

  const endRound = (game: GameState) => {
    setTimeout(() => {
      setGameStarted(false);
      setGameData(null);
      setGameMessage("");
      setRevealingCards(false);
      setShowdownWinner(null);
      setRevealedHands({});
    }, 2000);
  };

  const getCardColor = (card: PokerCard) => {
    return card.suit === "♥" || card.suit === "♦" ? "text-red-600" : "text-black";
  };

  const renderPlayerControls = () => {
    if (!gameData) return null;
    
    const player = gameData.players[0];
    
    if (revealingCards || waitingForBot || player.folded || 
        player.isAllIn || gameData.gamePhase === "showdown") {
      return null;
    }
    
    const canAct = gameData.currentPlayer === 0 || !player.hasActed;
    
    if (!canAct) {
      return (
        <div className="text-center py-4">
          <p className="text-amber-100">
            Waiting for {gameData.players[gameData.currentPlayer].name} to act...
          </p>
          <p className="text-amber-200/70 text-sm mt-2">
            Current bet: ${gameData.currentBet} • Your bet: ${player.bet}
          </p>
        </div>
      );
    }
    
    const callAmount = gameData.currentBet - player.bet;
    const minRaise = Math.max(gameData.currentBet * 2, gameData.bigBlind * 2);
    const maxAllowedBet = Math.min(maxBet, gameState.chips + player.bet);
    
    return (
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-amber-100 block mb-2 font-semibold">
            Your Bet: ${playerBet.toLocaleString()}
            {callAmount > 0 && (
              <span className="text-amber-300 ml-2 text-sm">
                To call: ${callAmount}
              </span>
            )}
          </label>
          <Slider
            value={[playerBet]}
            onValueChange={(value) => setPlayerBet(value[0])}
            min={Math.max(minRaise, gameData.currentBet)}
            max={maxAllowedBet}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-amber-200/60 mt-1">
            <span>${Math.max(minRaise, gameData.currentBet)}</span>
            <span>${maxAllowedBet.toLocaleString()}</span>
          </div>
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
            disabled={callAmount > gameState.chips}
          >
            {callAmount === 0 ? "Check" : `Call $${callAmount}`}
          </Button>
          <Button
            onClick={() => handlePlayerAction("raise")}
            disabled={playerBet <= gameData.currentBet || playerBet > gameState.chips + player.bet}
            className="bg-green-600 hover:bg-green-700 font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Raise
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => setPlayerBet(Math.max(minRaise, gameData.currentBet))}
            variant="outline"
            className="text-xs py-2 border-amber-500/50 text-amber-200"
          >
            Min (${Math.max(minRaise, gameData.currentBet)})
          </Button>
          <Button
            onClick={() => setPlayerBet(Math.min(gameData.currentBet * 2, maxAllowedBet))}
            variant="outline"
            className="text-xs py-2 border-amber-500/50 text-amber-200"
          >
            2x (${Math.min(gameData.currentBet * 2, maxAllowedBet)})
          </Button>
          <Button
            onClick={() => setPlayerBet(Math.min(gameData.pot, maxAllowedBet))}
            variant="outline"
            className="text-xs py-2 border-amber-500/50 text-amber-200"
          >
            Pot (${Math.min(gameData.pot, maxAllowedBet)})
          </Button>
          <Button
            onClick={() => setPlayerBet(maxAllowedBet)}
            variant="outline"
            className="text-xs py-2 border-amber-500/50 text-amber-200"
          >
            All-in (${maxAllowedBet})
          </Button>
        </div>
      </div>
    );
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
          <CardDescription className="text-amber-200/50">Professional Poker • VIP Exclusive</CardDescription>
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
              <span>Jerry ($25k)</span>
              <span>Billy ($100k)</span>
              <span>Faraday ($1M)</span>
            </div>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
            <h3 className="text-amber-100 font-semibold mb-3">Real Poker Rules</h3>
            <ul className="text-amber-200/70 text-sm space-y-1">
              <li>• Single deck, proper shuffling</li>
              <li>• Blinds: ${hasHighRoller ? '50/100' : '10/20'}</li>
              <li>• Proper betting rounds</li>
              <li>• Win immediately if all bots fold</li>
              <li>• Bots play more aggressively</li>
              <li>• Max bet: {hasHighRoller ? 'Unlimited' : '1000 chips'}</li>
            </ul>
          </div>

          <Button
            onClick={startGame}
            disabled={gameState.chips < 100}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 text-lg"
          >
            {gameState.chips < 100 ? "Not Enough Chips" : "Start Game"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 rounded-lg"
        style={{ backgroundImage: "url(/poker-table.png)" }}
      />
      
      <Card className="relative bg-black/60 border-amber-500/30 backdrop-blur-md">
        <CardHeader className="border-b border-amber-500/20 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-display text-amber-200">♠️ Poker Table</CardTitle>
              <CardDescription className="text-amber-200/50">
                {gameData?.gamePhase.toUpperCase()} • Blinds: ${gameData?.smallBlind}/${gameData?.bigBlind}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-sm">Pot</p>
              <div className="flex items-center gap-2">
                <img src="/chip-stack.png" alt="chips" className="w-8 h-8" />
                <p className="text-amber-300 font-bold text-2xl">${gameData?.pot.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {gameMessage && (
            <div className={`p-3 rounded text-center font-semibold animate-pulse ${showdownWinner ? 'bg-green-900/60 border-green-500/50 text-green-100' : 'bg-amber-900/40 border-amber-500/40 text-amber-100'}`}>
              {gameMessage}
              {showdownWinner && (
                <div className="mt-2 text-lg flex items-center justify-center gap-2">
                  <span className="text-yellow-300">🏆</span>
                  <span>{showdownWinner.name} wins!</span>
                  <span className="text-yellow-300">🏆</span>
                </div>
              )}
            </div>
          )}

          <div className="text-center pb-4 border-b border-amber-500/20">
            <div className="flex justify-center items-center gap-3">
              <p className="text-amber-200 font-display text-lg">🎴 Dealer</p>
              <img src="/dealer-deck.png" alt="deck" className="w-16 h-16 rounded" />
              <p className="text-amber-200/70">Cards left: {gameData?.deck.length || 0}</p>
            </div>
          </div>

          {gameData && gameData.sidePots.length > 0 && (
            <div className="bg-purple-900/30 border border-purple-500/30 p-2 rounded-lg">
              <p className="text-amber-100 text-sm text-center">Side Pots</p>
              <div className="flex gap-2 justify-center mt-1">
                {gameData.sidePots.map((pot, idx) => (
                  <div key={idx} className="px-3 py-1 bg-purple-800/50 rounded text-xs text-amber-200">
                    ${pot.amount.toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameData && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {gameData.players.filter(p => p.isBot).map((bot) => (
                <div 
                  key={bot.id}
                  className={`bg-amber-900/20 border p-3 rounded-lg transition-all ${
                    bot.folded ? 'border-red-500/30 opacity-50' : 
                    bot.isAllIn ? 'border-yellow-500/50 bg-yellow-900/20' : 
                    'border-amber-500/30'
                  } ${showdownWinner?.id === bot.id && !bot.folded ? 'ring-2 ring-yellow-400 ring-opacity-70' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-amber-100 font-semibold">{bot.name}</p>
                      <p className="text-amber-200/70 text-sm">Chips: ${bot.chips.toLocaleString()}</p>
                      <p className="text-amber-200/70 text-sm">Bet: ${bot.bet.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs px-2 py-1 rounded bg-amber-800/50 text-amber-200">
                        {bot.name === "Jerry" ? "$25k" : bot.name === "Billy" ? "$100k" : "$1M"}
                      </div>
                      {bot.isAllIn && (
                        <div className="text-xs px-2 py-1 rounded bg-yellow-800/50 text-yellow-200">
                          ALL-IN
                        </div>
                      )}
                    </div>
                  </div>
                  {bot.lastAction && (
                    <p className="text-yellow-300 text-xs mt-1 truncate">
                      {bot.lastAction}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 justify-center">
                    {!bot.folded && bot.hand.map((card, idx) => (
                      <div
                        key={idx}
                        className={`w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center text-xl font-bold shadow-lg transition-all duration-500 ${
                          revealingCards && revealedHands[bot.id] 
                            ? 'bg-white border-amber-500 transform scale-110'
                            : 'bg-blue-900 border-blue-700'
                        }`}
                      >
                        {revealingCards && revealedHands[bot.id] ? (
                          <>
                            <span className={getCardColor(card)}>{card.rank}</span>
                            <span className={getCardColor(card)}>{card.suit}</span>
                          </>
                        ) : (
                          <span className="text-blue-300">🂠</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {revealingCards && revealedHands[bot.id] && (
                    <div className="text-center mt-2">
                      <p className="text-xs text-green-300 font-semibold">Cards Revealed</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {gameData && gameData.communityCards.length > 0 && (
            <div className="bg-green-900/30 border border-amber-500/30 p-4 rounded-lg">
              <p className="text-amber-100 mb-3 font-semibold text-center">Community Cards</p>
              <div className="flex gap-3 justify-center">
                {gameData.communityCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`w-20 h-28 bg-white rounded-lg border-2 border-amber-500 flex flex-col items-center justify-center text-3xl font-bold shadow-lg ${animatingCards ? 'animate-bounce' : ''}`}
                  >
                    <span className={getCardColor(card)}>{card.rank}</span>
                    <span className={getCardColor(card)}>{card.suit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameData && (
            <div className={`bg-gradient-to-br from-amber-900/40 to-amber-800/40 border-2 p-4 rounded-lg transition-all duration-300 ${
              showdownWinner?.id === 0 && !gameData.players[0].folded ? 'border-yellow-400 ring-2 ring-yellow-400 ring-opacity-70' : 
              gameData.players[0].isAllIn ? 'border-yellow-500/70 bg-yellow-900/30' :
              'border-amber-500/50'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-amber-100 font-bold text-lg">You</p>
                  <p className="text-amber-200/70">Chips: ${gameState.chips.toLocaleString()}</p>
                  <p className="text-amber-200/70">Bet: ${gameData.players[0].bet.toLocaleString()}</p>
                  {gameData.players[0].isAllIn && (
                    <p className="text-yellow-300 text-sm font-semibold">ALL-IN!</p>
                  )}
                  {gameData.players[0].lastAction.includes('blind') && (
                    <p className="text-blue-300 text-sm">{gameData.players[0].lastAction}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {gameData.players[0].hand.map((card, idx) => (
                    <div
                      key={idx}
                      className={`w-20 h-28 rounded-lg border-2 flex flex-col items-center justify-center text-3xl font-bold shadow-xl transition-all duration-500 ${
                        revealingCards && revealedHands[0]
                          ? 'bg-white border-amber-500 transform scale-110'
                          : 'bg-gradient-to-br from-amber-300 to-amber-600 border-amber-700'
                      }`}
                    >
                      {revealingCards && revealedHands[0] ? (
                        <>
                          <span className={getCardColor(card)}>{card.rank}</span>
                          <span className={getCardColor(card)}>{card.suit}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-white">{card.rank}</span>
                          <span className="text-white">{card.suit}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {renderPlayerControls()}

              {waitingForBot && !revealingCards && (
                <div className="text-center py-4">
                  <p className="text-amber-100 animate-pulse">
                    {gameData.currentPlayer > 0 ? 
                      `${gameData.players[gameData.currentPlayer].name}'s turn...` : 
                      "Waiting for other players..."}
                  </p>
                </div>
              )}

              {revealingCards && revealedHands[0] && (
                <div className="text-center py-3">
                  <p className="text-green-300 font-semibold">Your cards are revealed!</p>
                </div>
              )}

              {gameData.players[0].folded && (
                <div className="text-center py-4">
                  <p className="text-red-300 font-semibold">You folded</p>
                </div>
              )}

              {gameData.players[0].isAllIn && !revealingCards && gameData.gamePhase !== "showdown" && (
                <div className="text-center py-4">
                  <p className="text-yellow-300 font-semibold animate-pulse">You're ALL-IN! Waiting...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}