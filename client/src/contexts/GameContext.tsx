import { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

interface GameState {
  coins: number;
  chips: number;
  clickCount: number;
  clickValue: number;
  autoClickerValue: number;
  autoClickerInterval: number; // in milliseconds
  upgrades: {
    doubleClick: boolean;
    tripleClick: boolean;
    clickPowerII: number; // count of purchases
    autoClicker: boolean;
    autoClickerBoost: boolean;
    goldenDollar: boolean;
    confettiClick: boolean;
    backgroundTheme: boolean;
    diceGame: boolean;
    blackjackGame: boolean;
    // New upgrades
    megaClick: boolean;
    superAutoClicker: boolean;
    turboMode: boolean;
    luckyGambler: boolean;
    vipStatus: boolean;
    moneyMagnet: boolean;
    clickMultiplierX5: boolean;
    diamondClicker: boolean;
    fortuneBoost: boolean;
    highRoller: boolean;
    rouletteGame: boolean;
    neonGlow: boolean;
    particleTrail: boolean;
    premiumTheme: boolean;
  };
}

const INITIAL_STATE: GameState = {
  coins: 0,
  chips: 0,
  clickCount: 0,
  clickValue: 1,
  autoClickerValue: 0,
  autoClickerInterval: 10000,
  upgrades: {
    doubleClick: false,
    tripleClick: false,
    clickPowerII: 0,
    autoClicker: false,
    autoClickerBoost: false,
    goldenDollar: false,
    confettiClick: false,
    backgroundTheme: false,
    diceGame: false,
    blackjackGame: false,
    // New upgrades
    megaClick: false,
    superAutoClicker: false,
    turboMode: false,
    luckyGambler: false,
    vipStatus: false,
    moneyMagnet: false,
    clickMultiplierX5: false,
    diamondClicker: false,
    fortuneBoost: false,
    highRoller: false,
    rouletteGame: false,
    neonGlow: false,
    particleTrail: false,
    premiumTheme: false,
  },
};

interface GameContextType {
  state: GameState;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => boolean;
  addChips: (amount: number) => void;
  removeChips: (amount: number) => boolean;
  convertCoinsToChips: (amount: number) => boolean;
  convertChipsToCoins: (amount: number) => boolean;
  purchaseUpgrade: (upgradeKey: keyof GameState["upgrades"], cost: number) => boolean;
  incrementClickCount: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const submitScoreMutation = trpc.leaderboard.submitScore.useMutation();
  
  const [state, setState] = useState<GameState>(() => {
    // Load from cookies/local storage on init
    const saved = localStorage.getItem("fridgee_casino_save");
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Save to local storage whenever state changes
  useEffect(() => {
    localStorage.setItem("fridgee_casino_save", JSON.stringify(state));
  }, [state]);

  // Sync score to backend when coins change (if authenticated)
  useEffect(() => {
    if (isAuthenticated && user && state.coins > 0) {
      // Debounce the submission to avoid too many requests
      const timer = setTimeout(() => {
        submitScoreMutation.mutate({ score: state.coins });
      }, 2000); // Submit 2 seconds after last coin change
      
      return () => clearTimeout(timer);
    }
  }, [state.coins, isAuthenticated, user]);

  // Auto Clicker Logic
  useEffect(() => {
    if (state.autoClickerValue > 0) {
      const interval = setInterval(() => {
        addCoins(state.autoClickerValue);
      }, state.autoClickerInterval);
      return () => clearInterval(interval);
    }
  }, [state.autoClickerValue, state.autoClickerInterval]);

  // Money Magnet Passive Income
  useEffect(() => {
    if (state.upgrades.moneyMagnet) {
      const interval = setInterval(() => {
        addCoins(50);
      }, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.upgrades.moneyMagnet]);

  const addCoins = (amount: number) => {
    setState((prev) => ({ ...prev, coins: prev.coins + amount }));
  };

  const removeCoins = (amount: number) => {
    if (state.coins >= amount) {
      setState((prev) => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  };

  const addChips = (amount: number) => {
    setState((prev) => ({ ...prev, chips: prev.chips + amount }));
  };

  const removeChips = (amount: number) => {
    if (state.chips >= amount) {
      setState((prev) => ({ ...prev, chips: prev.chips - amount }));
      return true;
    }
    return false;
  };

  const convertCoinsToChips = (coinAmount: number) => {
    // 1 chip = $10
    const chipAmount = Math.floor(coinAmount / 10);
    const actualCoinCost = chipAmount * 10;
    
    if (chipAmount <= 0) return false;
    if (removeCoins(actualCoinCost)) {
      addChips(chipAmount);
      return true;
    }
    return false;
  };

  const convertChipsToCoins = (chipAmount: number) => {
    // 1 chip = $10
    if (removeChips(chipAmount)) {
      addCoins(chipAmount * 10);
      return true;
    }
    return false;
  };

  const calculateClickValue = (currentUpgrades: GameState["upgrades"]) => {
    let val = 1;
    
    // Base click upgrades (highest tier wins)
    if (currentUpgrades.megaClick) val = 10;
    else if (currentUpgrades.tripleClick) val = 3;
    else if (currentUpgrades.doubleClick) val = 2;

    // Click Power II stacks
    val += currentUpgrades.clickPowerII;

    // Multipliers
    if (currentUpgrades.goldenDollar) val *= 2;
    if (currentUpgrades.clickMultiplierX5) val *= 5;
    if (currentUpgrades.diamondClicker) val *= 3;

    return val;
  };

  const calculateAutoClickerValue = (currentUpgrades: GameState["upgrades"]) => {
    if (!currentUpgrades.autoClicker) return 0;
    let val = 1;
    if (currentUpgrades.autoClickerBoost) val = 5;
    if (currentUpgrades.superAutoClicker) val = 10;
    return val;
  };

  const getAutoClickerInterval = (currentUpgrades: GameState["upgrades"]) => {
    if (currentUpgrades.turboMode) return 5000; // Every 5 seconds
    return 10000; // Every 10 seconds
  };

  const purchaseUpgrade = (upgradeKey: keyof GameState["upgrades"], cost: number) => {
    if (state.coins >= cost) {
      setState((prev) => {
        const newUpgrades = { ...prev.upgrades };
        
        if (upgradeKey === 'clickPowerII') {
             newUpgrades.clickPowerII += 1;
        } else {
             // @ts-ignore
             newUpgrades[upgradeKey] = true;
        }

        const newClickValue = calculateClickValue(newUpgrades);
        const newAutoClickerValue = calculateAutoClickerValue(newUpgrades);
        const newInterval = getAutoClickerInterval(newUpgrades);

        return {
          ...prev,
          coins: prev.coins - cost,
          upgrades: newUpgrades,
          clickValue: newClickValue,
          autoClickerValue: newAutoClickerValue,
          autoClickerInterval: newInterval
        };
      });
      return true;
    }
    return false;
  };

  const incrementClickCount = () => {
    setState((prev) => ({
      ...prev,
      clickCount: prev.clickCount + 1,
      coins: prev.coins + prev.clickValue,
    }));
  };

  const resetGame = () => {
    setState(INITIAL_STATE);
  };

  return (
    <GameContext.Provider
      value={{
        state,
        addCoins,
        removeCoins,
        addChips,
        removeChips,
        convertCoinsToChips,
        convertChipsToCoins,
        purchaseUpgrade,
        incrementClickCount,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
