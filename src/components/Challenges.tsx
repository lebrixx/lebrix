import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Target, Trophy, Star, CheckCircle, Lock, Flame, Crown } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert' | 'impossible';
}

interface ChallengesProps {
  onBack: () => void;
  currentScore: number;
  bestScore: number;
  coins: number;
  maxSpeedReached: number;
  directionChanges: number;
  totalGamesPlayed: number;
  onReward: (coins: number) => void;
}

const CHALLENGES: Challenge[] = [
  // Défis Faciles
  {
    id: 'score_5',
    title: 'Premier Contact',
    description: 'Atteignez le score de 5',
    target: 5,
    reward: 25,
    difficulty: 'facile',
  },
  {
    id: 'score_10',
    title: 'En Cadence',
    description: 'Atteignez le score de 10',
    target: 10,
    reward: 50,
    difficulty: 'facile',
  },
  {
    id: 'score_15',
    title: 'Rythme Soutenu',
    description: 'Atteignez le score de 15',
    target: 15,
    reward: 75,
    difficulty: 'moyen',
  },
  
  // Défis Moyens
  {
    id: 'score_25',
    title: 'Maître du Timing',
    description: 'Atteignez le score de 25',
    target: 25,
    reward: 100,
    difficulty: 'moyen',
  },
  {
    id: 'score_35',
    title: 'Réflexes d\'Acier',
    description: 'Atteignez le score de 35',
    target: 35,
    reward: 150,
    difficulty: 'moyen',
  },
  {
    id: 'score_50',
    title: 'Machine de Précision',
    description: 'Atteignez le score de 50',
    target: 50,
    reward: 200,
    difficulty: 'difficile',
  },
  
  // Défis Difficiles
  {
    id: 'score_75',
    title: 'Virtuose Ultime',
    description: 'Atteignez le score de 75',
    target: 75,
    reward: 300,
    difficulty: 'difficile',
  },
  {
    id: 'score_100',
    title: 'Centurion',
    description: 'Atteignez le score de 100',
    target: 100,
    reward: 500,
    difficulty: 'expert',
  },
  {
    id: 'score_150',
    title: 'Légende Vivante',
    description: 'Atteignez le score de 150',
    target: 150,
    reward: 750,
    difficulty: 'expert',
  },
  
  // Défis Impossibles
  {
    id: 'score_200',
    title: 'Dieu du Timing',
    description: 'Atteignez le score de 200',
    target: 200,
    reward: 1000,
    difficulty: 'impossible',
  },
  {
    id: 'score_300',
    title: 'Transcendance',
    description: 'Atteignez le score de 300',
    target: 300,
    reward: 1500,
    difficulty: 'impossible',
  },
  {
    id: 'score_500',
    title: 'Au-delà de l\'Impossible',
    description: 'Atteignez le score de 500',
    target: 500,
    reward: 2500,
    difficulty: 'impossible',
  },
];

export const Challenges: React.FC<ChallengesProps> = ({
  onBack,
  currentScore,
  bestScore,
  coins,
  maxSpeedReached,
  directionChanges,
  totalGamesPlayed,
  onReward,
}) => {
  const [completedChallenges, setCompletedChallenges] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('luckyStopCompletedChallenges');
    return saved ? JSON.parse(saved) : [];
  });

  const checkAndCompleteChallenge = (challenge: Challenge) => {
    if (completedChallenges.includes(challenge.id)) return false;

    const isCompleted = bestScore >= challenge.target;

    if (isCompleted) {
      const newCompleted = [...completedChallenges, challenge.id];
      setCompletedChallenges(newCompleted);
      localStorage.setItem('luckyStopCompletedChallenges', JSON.stringify(newCompleted));
      onReward(challenge.reward);
      return true;
    }

    return false;
  };

  React.useEffect(() => {
    CHALLENGES.forEach(challenge => {
      checkAndCompleteChallenge(challenge);
    });
  }, [bestScore]);

  const getProgress = (challenge: Challenge) => {
    return Math.min((bestScore / challenge.target) * 100, 100);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'moyen': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'difficile': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'expert': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'impossible': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return <Target className="w-4 h-4" />;
      case 'moyen': return <Trophy className="w-4 h-4" />;
      case 'difficile': return <Star className="w-4 h-4" />;
      case 'expert': return <Flame className="w-4 h-4" />;
      case 'impossible': return <Crown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const groupedChallenges = CHALLENGES.reduce((acc, challenge) => {
    if (!acc[challenge.difficulty]) acc[challenge.difficulty] = [];
    acc[challenge.difficulty].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  const difficultyOrder = ['facile', 'moyen', 'difficile', 'expert', 'impossible'];
  const difficultyNames = {
    facile: '🟢 Défis Faciles',
    moyen: '🟡 Défis Moyens',
    difficile: '🟠 Défis Difficiles',
    expert: '🔴 Défis Experts',
    impossible: '🟣 Défis Impossibles',
  };

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">🏆 DÉFIS DE SCORE</h1>
          <div className="text-text-secondary">
            Meilleur Score: <span className="text-primary font-bold">{bestScore}</span>
          </div>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Description */}
      <div className="text-center mb-6 text-text-muted animate-fade-in">
        <p>🎯 Testez vos limites avec des objectifs de score toujours plus élevés!</p>
      </div>

      {/* Challenges by Difficulty */}
      <div className="max-w-6xl mx-auto space-y-8">
        {difficultyOrder.map((difficulty) => {
          const challenges = groupedChallenges[difficulty];
          if (!challenges) return null;
          
          return (
            <div key={difficulty} className="animate-fade-in">
              <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
                {getDifficultyIcon(difficulty)}
                {difficultyNames[difficulty as keyof typeof difficultyNames]}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map((challenge) => {
                  const isCompleted = completedChallenges.includes(challenge.id);
                  const progress = getProgress(challenge);
                  
                  return (
                    <Card
                      key={challenge.id}
                      className={`
                        bg-button-bg border-wheel-border p-6 transition-all duration-300 animate-scale-in
                        ${isCompleted ? 'border-success shadow-glow-success' : 'hover:scale-105'}
                        ${difficulty === 'impossible' ? 'border-purple-500/50 shadow-purple-500/20' : ''}
                        ${difficulty === 'expert' ? 'border-red-500/50 shadow-red-500/20' : ''}
                      `}
                    >
                      {/* Challenge Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Target className="w-5 h-5" />
                          <h3 className="font-bold text-lg">{challenge.title}</h3>
                        </div>
                        
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                        ) : (
                          <Lock className="w-6 h-6 text-text-muted flex-shrink-0" />
                        )}
                      </div>

                      {/* Challenge Description */}
                      <p className="text-text-secondary text-sm mb-4">
                        {challenge.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>Progression: {bestScore}/{challenge.target}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2"
                        />
                      </div>

                      {/* Challenge Footer */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}
                        >
                          {getDifficultyIcon(challenge.difficulty)}
                          {challenge.difficulty.toUpperCase()}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-secondary font-bold">
                          <Trophy className="w-4 h-4" />
                          {challenge.reward}
                        </div>
                      </div>

                      {/* Completion Status */}
                      {isCompleted && (
                        <div className="mt-3 pt-3 border-t border-success/30">
                          <div className="text-success text-sm font-bold text-center">
                            ✨ DÉFI ACCOMPLI ✨
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-button-bg border border-wheel-border rounded-lg animate-fade-in">
        <h3 className="text-xl font-bold text-primary mb-4 text-center">Vos Statistiques</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-success">{completedChallenges.length}</div>
            <div className="text-text-muted text-sm">Défis Accomplis</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{CHALLENGES.length}</div>
            <div className="text-text-muted text-sm">Défis Totaux</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">{bestScore}</div>
            <div className="text-text-muted text-sm">Meilleur Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">{Math.round(((completedChallenges.length / CHALLENGES.length) * 100))}%</div>
            <div className="text-text-muted text-sm">Complétés</div>
          </div>
        </div>
      </div>
    </div>
  );
};