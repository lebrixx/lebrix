import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap, Star, Clock, Coins } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  type: 'score' | 'streak' | 'perfect' | 'speed' | 'endurance';
  icon: React.ElementType;
  difficulty: 'easy' | 'medium' | 'hard';
  resetDaily?: boolean;
}

interface ChallengesProps {
  onBack: () => void;
  coins: number;
  onRewardClaim: (reward: number) => void;
  gameStats: {
    totalGames: number;
    totalWins: number;
    bestScore: number;
    perfectRounds: number;
    fastRounds: number;
  };
}

export const Challenges: React.FC<ChallengesProps> = ({
  onBack,
  coins,
  onRewardClaim,
  gameStats,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem('gameChallenges');
    const defaultChallenges: Challenge[] = [
      // Daily Challenges
      {
        id: 'daily_score_10',
        title: 'Daily Master',
        description: 'Reach score 10 in a single game',
        target: 10,
        current: 0,
        reward: 50,
        type: 'score',
        icon: Trophy,
        difficulty: 'easy',
        resetDaily: true,
      },
      {
        id: 'daily_perfect_3',
        title: 'Perfect Precision',
        description: 'Hit 3 perfect stops in one game',
        target: 3,
        current: 0,
        reward: 75,
        type: 'perfect',
        icon: Target,
        difficulty: 'medium',
        resetDaily: true,
      },
      {
        id: 'daily_speed_demon',
        title: 'Speed Demon',
        description: 'Complete 5 fast rounds under 1 second',
        target: 5,
        current: 0,
        reward: 100,
        type: 'speed',
        icon: Zap,
        difficulty: 'hard',
        resetDaily: true,
      },
      
      // Weekly Challenges
      {
        id: 'weekly_endurance',
        title: 'Endurance Master',
        description: 'Play 50 total games this week',
        target: 50,
        current: 0,
        reward: 200,
        type: 'endurance',
        icon: Clock,
        difficulty: 'medium',
      },
      {
        id: 'weekly_coin_collector',
        title: 'Coin Collector',
        description: 'Earn 500 coins this week',
        target: 500,
        current: 0,
        reward: 300,
        type: 'streak',
        icon: Coins,
        difficulty: 'hard',
      },
      
      // Achievement Challenges
      {
        id: 'achievement_legend',
        title: 'Legendary Player',
        description: 'Reach score 25 (ultimate challenge)',
        target: 25,
        current: 0,
        reward: 500,
        type: 'score',
        icon: Star,
        difficulty: 'hard',
      },
      {
        id: 'achievement_hundred_wins',
        title: 'Century Club',
        description: 'Win 100 total games',
        target: 100,
        current: 0,
        reward: 250,
        type: 'streak',
        icon: Trophy,
        difficulty: 'medium',
      },
    ];

    if (saved) {
      try {
        const parsedChallenges = JSON.parse(saved);
        // Merge with defaults to add any new challenges
        return defaultChallenges.map(def => {
          const existing = parsedChallenges.find((c: Challenge) => c.id === def.id);
          return existing ? { ...def, current: existing.current } : def;
        });
      } catch (e) {
        return defaultChallenges;
      }
    }
    return defaultChallenges;
  });

  // Update challenge progress based on game stats
  useEffect(() => {
    setChallenges(prev => prev.map(challenge => {
      let newCurrent = challenge.current;
      
      switch (challenge.type) {
        case 'score':
          if (challenge.id === 'daily_score_10' || challenge.id === 'achievement_legend') {
            newCurrent = Math.min(gameStats.bestScore, challenge.target);
          }
          break;
        case 'streak':
          if (challenge.id === 'achievement_hundred_wins') {
            newCurrent = Math.min(gameStats.totalWins, challenge.target);
          }
          break;
        case 'endurance':
          if (challenge.id === 'weekly_endurance') {
            newCurrent = Math.min(gameStats.totalGames, challenge.target);
          }
          break;
      }
      
      return { ...challenge, current: newCurrent };
    }));
  }, [gameStats]);

  // Save challenges to localStorage
  useEffect(() => {
    localStorage.setItem('gameChallenges', JSON.stringify(challenges));
  }, [challenges]);

  const claimReward = (challengeId: string, reward: number) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, current: challenge.target }
        : challenge
    ));
    onRewardClaim(reward);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-gradient-success';
      case 'medium': return 'bg-gradient-primary';
      case 'hard': return 'bg-gradient-danger';
      default: return 'bg-gradient-primary';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return 'Medium';
    }
  };

  const completedChallenges = challenges.filter(c => c.current >= c.target);
  const activeChallenges = challenges.filter(c => c.current < c.target);

  return (
    <div className="min-h-screen bg-gradient-game p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          ← Back
        </Button>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Challenges</h1>
          <div className="text-text-secondary">
            Coins: {coins} • Completed: {completedChallenges.length}/{challenges.length}
          </div>
        </div>
        <div className="w-20"></div>
      </div>

      {/* Challenge Categories */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Active Challenges */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Active Challenges
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const progress = (challenge.current / challenge.target) * 100;
              
              return (
                <Card key={challenge.id} className="bg-game-dark border-wheel-border p-4 hover:bg-button-hover transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <Badge className={`${getDifficultyColor(challenge.difficulty)} text-white text-xs`}>
                        {getDifficultyText(challenge.difficulty)}
                      </Badge>
                      {challenge.resetDaily && (
                        <Badge variant="outline" className="text-xs">Daily</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Coins className="w-4 h-4" />
                      {challenge.reward}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-text-primary mb-2">{challenge.title}</h3>
                  <p className="text-text-secondary text-sm mb-3">{challenge.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Progress</span>
                      <span className="text-text-primary">{challenge.current}/{challenge.target}</span>
                    </div>
                    <div className="w-full bg-wheel-base rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    
                    {challenge.current >= challenge.target && (
                      <Button
                        onClick={() => claimReward(challenge.id, challenge.reward)}
                        className="w-full bg-gradient-success hover:scale-105 transition-transform mt-2"
                      >
                        Claim Reward!
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-success" />
              Completed Challenges
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {completedChallenges.map((challenge) => {
                const Icon = challenge.icon;
                
                return (
                  <Card key={challenge.id} className="bg-game-dark border-success/30 p-4 opacity-75">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-success" />
                        <Badge className="bg-gradient-success text-white text-xs">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-success">
                        <Coins className="w-4 h-4" />
                        {challenge.reward}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-text-primary mb-2">{challenge.title}</h3>
                    <p className="text-text-secondary text-sm">{challenge.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};