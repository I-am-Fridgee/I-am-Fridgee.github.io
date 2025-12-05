import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { trpc } from "@/lib/trpc";

interface GameState {
  coins: number;
  chips: number;
  clickCount: number;
  clickValue: number;
  autoClickerValue: number;
  autoClickerInterval: number;
  activeCosmetics: {
    confettiClick: boolean;
    backgroundTheme: boolean;
    neonGlow: boolean;
    particleTrail: boolean;
    premiumTheme: boolean;
    rainbowClicker: boolean;
    starryBackground: boolean;
    goldenFrame: boolean;
    fireworksEffect: boolean;
    velvetCurtains: boolean;
  };
  upgrades: {
    doubleClick: boolean;
    tripleClick: boolean;
    clickPowerII: number;
    autoClicker: boolean;
    autoClickerBoost: boolean;
    autoClickerPro: boolean;
    autoClickerMax: boolean;
    hyperClicker: boolean;
    goldenDollar: boolean;
    confettiClick: boolean;
    backgroundTheme: boolean;
    diceGame: boolean;
    blackjackGame: boolean;
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
    pokerGame: boolean;
    neonGlow: boolean;
    particleTrail: boolean;
    premiumTheme: boolean;
    rainbowClicker: boolean;
    starryBackground: boolean;
    goldenFrame: boolean;
    fireworksEffect: boolean;
    velvetCurtains: boolean;
  };
}

const INITIAL_STATE: GameState = {
  coins: 0,
  chips: 0,
  clickCount: 0,
  clickValue: 1,
  autoClickerValue: 0,
  autoClickerInterval: 10000,
  activeCosmetics: {
    confettiClick: false,
    backgroundTheme: false,
    neonGlow: false,
    particleTrail: false,
    premiumTheme: false,
    rainbowClicker: false,
    starryBackground: false,
    goldenFrame: false,
    fireworksEffect: false,
    velvetCurtains: false,
  },
  upgrades: {
    doubleClick: false,
    tripleClick: false,
    clickPowerII: 0,
    autoClicker: false,
    autoClickerBoost: false,
    autoClickerPro: false,
    autoClickerMax: false,
    hyperClicker: false,
    goldenDollar: false,
    confettiClick: false,
    backgroundTheme: false,
    diceGame: false,
    blackjackGame: false,
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
    pokerGame: false,
    neonGlow: false,
    particleTrail: false,
    premiumTheme: false,
    rainbowClicker: false,
    starryBackground: false,
    goldenFrame: false,
    fireworksEffect: false,
    velvetCurtains: false,
  },
};

interface GameContextType {
  state: GameState;
  toggleCosmetic: (cosmeticKey: keyof GameState["activeCosmetics"]) => void;
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => boolean;
  addChips: (amount: number) => void;
  removeChips: (amount: number) => boolean;
  convertCoinsToChips: (amount: number) => boolean;
  convertChipsToCoins: (amount: number) => boolean;
  purchaseUpgrade: (upgradeKey: keyof GameState["upgrades"], cost: number) => boolean;
  incrementClickCount: () => void;
  resetGame: () => void;
  syncToDatabase: () => Promise<void>;
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
  const getUserDataMutation = trpc.leaderboard.getUserData.useMutation();
  const saveGameDataMutation = trpc.leaderboard.saveGameData.useMutation();

  const [state, setState] = useState<GameState>(() => {
    // Load from localStorage with -v2 suffix
    const saved = localStorage.getItem("fridgee_casino_save-v2");
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("fridgee_casino_save-v2", JSON.stringify(state));
  }, [state]);

  // Sync from database when user logs in
  useEffect(() => {
    const syncFromDatabase = async () => {
      if (isAuthenticated && user && !authLoading) {
        try {
          const userData = await getUserDataMutation.mutateAsync();
          if (userData) {
            // Merge database data with local data (database takes priority for coins/chips)
            setState((prev) => ({
              ...prev,
              coins: userData.coins ?? prev.coins,
              chips: userData.chips ?? prev.chips,
              clickCount: userData.clickCount ?? prev.clickCount,
              upgrades: userData.upgrades ? JSON.parse(userData.upgrades) : prev.upgrades,
              activeCosmetics: userData.activeCosmetics ? JSON.parse(userData.activeCosmetics) : prev.activeCosmetics,
            }));
          }
        } catch (error) {
          console.error("Failed to sync from database:", error);
        }
      }
    };

    syncFromDatabase();
  }, [isAuthenticated, user, authLoading]);

  // Auto-sync to database every 30 seconds if authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const syncInterval = setInterval(async () => {
      try {
        await saveGameDataMutation.mutateAsync({
          coins: state.coins,
          chips: state.chips,
          clickCount: state.clickCount,
          upgrades: JSON.stringify(state.upgrades),
          activeCosmetics: JSON.stringify(state.activeCosmetics),
        });
      } catch (error) {
        console.error("Failed to save game data:", error);
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, user, state]);

  // Submit score to leaderboard
  useEffect(() => {
    if (isAuthenticated && user && state.coins > 0) {
      const timer = setTimeout(() => {
        submitScoreMutation.mutate({ score: state.coins });
      }, 2000);

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
      }, 30000);
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
    if (removeChips(chipAmount)) {
      addCoins(chipAmount * 10);
      return true;
    }
    return false;
  };

  const calculateClickValue = (currentUpgrades: GameState["upgrades"]) => {
    let val = 1;

    if (currentUpgrades.megaClick) val = 10;
    else if (currentUpgrades.tripleClick) val = 3;
    else if (currentUpgrades.doubleClick) val = 2;

    val += currentUpgrades.clickPowerII;

    if (currentUpgrades.goldenDollar) val *= 2;
    if (currentUpgrades.clickMultiplierX5) val *= 5;
    if (currentUpgrades.diamondClicker) val *= 3;

    return val;
  };

  const calculateAutoClickerValue = (currentUpgrades: GameState["upgrades"]) => {
    if (!currentUpgrades.autoClicker) return 0;
    let val = 1;
    if (currentUpgrades.autoClickerBoost) val = 5;
    if (currentUpgrades.autoClickerPro) val = 15;
    if (currentUpgrades.autoClickerMax) val = 25;
    if (currentUpgrades.superAutoClicker) val = 10;
    return val;
  };

  const getAutoClickerInterval = (currentUpgrades: GameState["upgrades"]) => {
    if (currentUpgrades.hyperClicker) return 3000;
    if (currentUpgrades.turboMode) return 5000;
    return 10000;
  };

  const purchaseUpgrade = (upgradeKey: keyof GameState["upgrades"], cost: number) => {
    if (state.coins >= cost) {
      setState((prev) => {
        const newUpgrades = { ...prev.upgrades };

        if (upgradeKey === "clickPowerII") {
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
          autoClickerInterval: newInterval,
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

  const toggleCosmetic = (cosmeticKey: keyof GameState["activeCosmetics"]) => {
    setState((prev) => ({
      ...prev,
      activeCosmetics: {
        ...prev.activeCosmetics,
        [cosmeticKey]: !prev.activeCosmetics[cosmeticKey],
      },
    }));
  };

  const resetGame = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem("fridgee_casino_save-v2");
  };

  const syncToDatabase = async () => {
    if (!isAuthenticated || !user) return;
    try {
      await saveGameDataMutation.mutateAsync({
        coins: state.coins,
        chips: state.chips,
        clickCount: state.clickCount,
        upgrades: JSON.stringify(state.upgrades),
        activeCosmetics: JSON.stringify(state.activeCosmetics),
      });
    } catch (error) {
      console.error("Failed to sync to database:", error);
    }
  };

  return (
    <GameContext.Provider
      value={{
        state,
        toggleCosmetic,
        addCoins,
        removeCoins,
        addChips,
        removeChips,
        convertCoinsToChips,
        convertChipsToCoins,
        purchaseUpgrade,
        incrementClickCount,
        resetGame,
        syncToDatabase,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
