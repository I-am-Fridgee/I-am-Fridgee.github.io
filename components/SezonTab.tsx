// components/SezonTab.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSezonPass } from '@/contexts/SezonPassContext';
import { Target, Calendar, Trophy, Star, Award } from 'lucide-react';

export default function SezonTab() {
  const { 
    currentXP, 
    level, 
    xpToNextLevel, 
    progressToNextLevel,
    dailyMissions, 
    weeklyMissions, 
    achievements,
    claimMission,
    loading 
  } = useSezonPass();

  if (loading) {
    return (
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardContent className="p-6 text-center">
          <p className="text-amber-200">Loading Sezon Pass...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar Section */}
      <Card className="bg-black/40 border-amber-500/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-amber-200">
            <Trophy className="w-6 h-6" />
            Sezon Pass
          </CardTitle>
          <p className="text-amber-200/60">Complete missions to earn XP and level up!</p>
        </CardHeader>
        <CardContent>
          {/* Level and XP Info */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-amber-100 text-lg">Level {level}</p>
              <p className="text-amber-200/60 text-sm">{currentXP} XP</p>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-lg">{xpToNextLevel - currentXP} XP to Level {level + 1}</p>
              <p className="text-amber-200/60 text-sm">Next level: {xpToNextLevel} XP</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative pt-1 mb-2">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-amber-300">
                  {Math.round(progressToNextLevel)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-amber-900/50">
              <div
                style={{ width: `${progressToNextLevel}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
              ></div>
            </div>
          </div>

          {/* XP Details */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-200 text-sm mb-1">Level Progress</p>
            <div className="flex justify-between text-xs text-amber-200/70">
              <span>Level {level}: {currentXP - ((level - 1) * 100)}/100 XP</span>
              <span>Total: {currentXP} XP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Missions */}
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-200">
              <Calendar className="w-5 h-5" />
              Daily Missions
            </CardTitle>
            <p className="text-blue-200/60 text-sm">Reset every day</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded border ${mission.isCompleted ? 'bg-green-900/20 border-green-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-blue-100 font-medium">{mission.title}</p>
                    <p className="text-blue-200/70 text-sm">{mission.description}</p>
                  </div>
                  <span className="text-yellow-300 font-bold">+{mission.xpReward} XP</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mission.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-200/60 mt-1">
                      {mission.progress}/{mission.target}
                    </p>
                  </div>
                  
                  {!mission.isCompleted && mission.progress >= mission.target ? (
                    <button
                      onClick={() => claimMission(mission.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      Claim
                    </button>
                  ) : mission.isCompleted ? (
                    <span className="px-3 py-1 bg-green-800/50 text-green-300 text-sm rounded">
                      ✓ Claimed
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Missions */}
        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-purple-200">
              <Calendar className="w-5 h-5" />
              Weekly Missions
            </CardTitle>
            <p className="text-purple-200/60 text-sm">Reset every week</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {weeklyMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded border ${mission.isCompleted ? 'bg-green-900/20 border-green-500/30' : 'bg-purple-900/20 border-purple-500/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-purple-100 font-medium">{mission.title}</p>
                    <p className="text-purple-200/70 text-sm">{mission.description}</p>
                  </div>
                  <span className="text-yellow-300 font-bold">+{mission.xpReward} XP</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mission.isCompleted ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-purple-200/60 mt-1">
                      {mission.progress}/{mission.target}
                    </p>
                  </div>
                  
                  {!mission.isCompleted && mission.progress >= mission.target ? (
                    <button
                      onClick={() => claimMission(mission.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      Claim
                    </button>
                  ) : mission.isCompleted ? (
                    <span className="px-3 py-1 bg-green-800/50 text-green-300 text-sm rounded">
                      ✓ Claimed
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-black/40 border-green-500/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-green-200">
              <Award className="w-5 h-5" />
              Achievements
            </CardTitle>
            <p className="text-green-200/60 text-sm">Permanent challenges</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded border ${mission.isCompleted ? 'bg-green-900/20 border-green-500/30' : 'bg-green-900/20 border-green-500/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-green-100 font-medium">{mission.title}</p>
                    <p className="text-green-200/70 text-sm">{mission.description}</p>
                  </div>
                  <span className="text-yellow-300 font-bold">+{mission.xpReward} XP</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="h-2 bg-green-900/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mission.isCompleted ? 'bg-green-500' : 'bg-green-500'}`}
                        style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-green-200/60 mt-1">
                      {mission.progress.toLocaleString()}/{mission.target.toLocaleString()}
                    </p>
                  </div>
                  
                  {!mission.isCompleted && mission.progress >= mission.target ? (
                    <button
                      onClick={() => claimMission(mission.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      Claim
                    </button>
                  ) : mission.isCompleted ? (
                    <span className="px-3 py-1 bg-green-800/50 text-green-300 text-sm rounded">
                      ✓ Claimed
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-black/40 border-gray-500/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">How Sezon Pass Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-200">Complete Missions</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Finish daily, weekly, and achievement missions to earn XP.
              </p>
            </div>
            
            <div className="p-4 bg-gray-900/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-200">Earn XP</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Each mission gives XP. More challenging missions give more XP.
              </p>
            </div>
            
            <div className="p-4 bg-gray-900/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-200">Level Up</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Earn rewards at each level. Higher levels give better rewards.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}