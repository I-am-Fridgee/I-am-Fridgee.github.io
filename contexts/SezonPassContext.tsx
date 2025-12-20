// contexts/SezonPassContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: 'daily' | 'weekly' | 'achievement';
  isCompleted: boolean;
  progress: number;
  target: number;
}

interface SezonPassData {
  currentXP: number;
  claimedLevels: number[];
  completedMissions: string[];
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
  achievements: Mission[];
  lastDailyReset: string;
  lastWeeklyReset: string;
}

const DEFAULT_SEZON_PASS: SezonPassData = {
  currentXP: 0,
  claimedLevels: [],
  completedMissions: [],
  dailyMissions: [
    {
      id: 'daily_play_games',
      title: 'Game Time',
      description: 'Play 5 games today',
      xpReward: 25,
      type: 'daily',
      isCompleted: false,
      progress: 0,
      target: 5
    },
    {
      id: 'daily_win_games',
      title: 'Winner Winner',
      description: 'Win 3 games today',
      xpReward: 50,
      type: 'daily',
      isCompleted: false,
      progress: 0,
      target: 3
    },
    {
      id: 'daily_spin_wheel',
      title: 'Lucky Spin',
      description: 'Spin the daily wheel',
      xpReward: 10,
      type: 'daily',
      isCompleted: false,
      progress: 0,
      target: 1
    }
  ],
  weeklyMissions: [
    {
      id: 'weekly_play_games',
      title: 'Game Marathon',
      description: 'Play 50 games this week',
      xpReward: 200,
      type: 'weekly',
      isCompleted: false,
      progress: 0,
      target: 50
    },
    {
      id: 'weekly_win_games',
      title: 'Weekly Champion',
      description: 'Win 25 games this week',
      xpReward: 500,
      type: 'weekly',
      isCompleted: false,
      progress: 0,
      target: 25
    }
  ],
  achievements: [
    {
      id: 'achieve_top_10',
      title: 'Climbing Ranks',
      description: 'Appear in Top 10 on leaderboard',
      xpReward: 10,
      type: 'achievement',
      isCompleted: false,
      progress: 0,
      target: 1
    },
    {
      id: 'achieve_100k_coins',
      title: 'Gold Rush',
      description: 'Get 100,000 coins',
      xpReward: 100,
      type: 'achievement',
      isCompleted: false,
      progress: 0,
      target: 100000
    },
    {
      id: 'achieve_1m_coins',
      title: 'Rich Rich RICH',
      description: 'Get 1,000,000 coins',
      xpReward: 1000,
      type: 'achievement',
      isCompleted: false,
      progress: 0,
      target: 1000000
    }
  ],
  lastDailyReset: '',
  lastWeeklyReset: ''
};

interface SezonPassContextType {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  dailyMissions: Mission[];
  weeklyMissions: Mission[];
  achievements: Mission[];
  totalXP: number;
  progressToNextLevel: number;
  addXP: (amount: number) => Promise<void>;
  updateMissionProgress: (missionId: string, progress: number) => Promise<void>;
  claimMission: (missionId: string) => Promise<void>;
  loading: boolean;
}

const SezonPassContext = createContext<SezonPassContextType | undefined>(undefined);

export const useSezonPass = () => {
  const context = useContext(SezonPassContext);
  if (!context) {
    throw new Error('useSezonPass must be used within a SezonPassProvider');
  }
  return context;
};

export const SezonPassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sezonPassData, setSezonPassData] = useState<SezonPassData>(DEFAULT_SEZON_PASS);
  const [loading, setLoading] = useState(true);

  // Calculate level based on XP (100 XP per level for now)
  const level = Math.floor(sezonPassData.currentXP / 100) + 1;
  const xpForCurrentLevel = (level - 1) * 100;
  const xpToNextLevel = level * 100;
  const progressToNextLevel = ((sezonPassData.currentXP - xpForCurrentLevel) / 100) * 100;

  // Load sezon pass data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSezonPassData = async () => {
      try {
        const sezonPassRef = doc(db, 'sezonPass', user.uid);
        const sezonPassDoc = await getDoc(sezonPassRef);

        if (sezonPassDoc.exists()) {
          setSezonPassData(sezonPassDoc.data() as SezonPassData);
        } else {
          // Create new sezon pass document for user
          await setDoc(sezonPassRef, DEFAULT_SEZON_PASS);
          setSezonPassData(DEFAULT_SEZON_PASS);
        }
      } catch (error) {
        console.error('Error loading sezon pass:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSezonPassData();
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;

    try {
      const sezonPassRef = doc(db, 'sezonPass', user.uid);
      const newXP = sezonPassData.currentXP + amount;
      
      await updateDoc(sezonPassRef, {
        currentXP: newXP
      });

      setSezonPassData(prev => ({
        ...prev,
        currentXP: newXP
      }));
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  };

  const updateMissionProgress = async (missionId: string, progress: number) => {
    if (!user) return;

    try {
      const sezonPassRef = doc(db, 'sezonPass', user.uid);
      
      // Find which mission array this belongs to
      const missionTypes = ['dailyMissions', 'weeklyMissions', 'achievements'] as const;
      
      for (const type of missionTypes) {
        const missionIndex = sezonPassData[type].findIndex(m => m.id === missionId);
        if (missionIndex !== -1) {
          const updatedMissions = [...sezonPassData[type]];
          updatedMissions[missionIndex] = {
            ...updatedMissions[missionIndex],
            progress: Math.min(progress, updatedMissions[missionIndex].target)
          };

          await updateDoc(sezonPassRef, {
            [type]: updatedMissions
          });

          setSezonPassData(prev => ({
            ...prev,
            [type]: updatedMissions
          }));
          
          break;
        }
      }
    } catch (error) {
      console.error('Error updating mission progress:', error);
    }
  };

  const claimMission = async (missionId: string) => {
    if (!user) return;

    try {
      const sezonPassRef = doc(db, 'sezonPass', user.uid);
      
      // Find the mission
      let mission: Mission | null = null;
      let missionType: 'dailyMissions' | 'weeklyMissions' | 'achievements' | null = null;
      
      const types: ('dailyMissions' | 'weeklyMissions' | 'achievements')[] = ['dailyMissions', 'weeklyMissions', 'achievements'];
      for (const type of types) {
        const found = sezonPassData[type].find(m => m.id === missionId);
        if (found) {
          mission = found;
          missionType = type;
          break;
        }
      }

      if (!mission || !missionType || mission.isCompleted || mission.progress < mission.target) {
        return;
      }

      // Mark as completed and add XP
      const updatedMissions = [...sezonPassData[missionType]];
      const missionIndex = updatedMissions.findIndex(m => m.id === missionId);
      updatedMissions[missionIndex] = {
        ...updatedMissions[missionIndex],
        isCompleted: true
      };

      const newXP = sezonPassData.currentXP + mission.xpReward;
      
      await updateDoc(sezonPassRef, {
        currentXP: newXP,
        [missionType]: updatedMissions,
        completedMissions: [...sezonPassData.completedMissions, missionId]
      });

      setSezonPassData(prev => ({
        ...prev,
        currentXP: newXP,
        [missionType]: updatedMissions,
        completedMissions: [...prev.completedMissions, missionId]
      }));
    } catch (error) {
      console.error('Error claiming mission:', error);
    }
  };

  const value: SezonPassContextType = {
    currentXP: sezonPassData.currentXP,
    level,
    xpToNextLevel,
    dailyMissions: sezonPassData.dailyMissions,
    weeklyMissions: sezonPassData.weeklyMissions,
    achievements: sezonPassData.achievements,
    totalXP: sezonPassData.currentXP,
    progressToNextLevel,
    addXP,
    updateMissionProgress,
    claimMission,
    loading
  };

  return (
    <SezonPassContext.Provider value={value}>
      {children}
    </SezonPassContext.Provider>
  );
};