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
  // Défi temporaire pour test
  {
    id: 'test-easy',
    title: 'Premier pas',
    description: 'Atteindre un score de 5 pour tester le système',
    target: 5,
    reward: 500,
    difficulty: 'facile'
  },
  {
    id: 'score-30',
    title: 'Précision maîtrisée',
    description: 'Atteindre un score de 30 points',
    target: 30,
    reward: 83,
    difficulty: 'moyen'
  },
  {
    id: 'score-40',
    title: 'Expert du timing',
    description: 'Atteindre un score de 40 points',
    target: 40,
    reward: 125,
    difficulty: 'difficile'
  },
  {
    id: 'score-50',
    title: 'Maître du cercle',
    description: 'Atteindre un score de 50 points',
    target: 50,
    reward: 167,
    difficulty: 'expert'
  },
  {
    id: 'games-50',
    title: 'Persévérant',
    description: 'Jouer 50 parties',
    target: 50,
    reward: 50,
    difficulty: 'facile'
  },
  {
    id: 'games-300',
    title: 'Accro du jeu',
    description: 'Jouer 300 parties',
    target: 300,
    reward: 250,
    difficulty: 'expert'
  }
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
  // Récupérer les défis complétés depuis localStorage
  const getCompletedChallenges = (): string[] => {
    const saved = localStorage.getItem('completedChallenges');
    return saved ? JSON.parse(saved) : [];
  };

  // Sauvegarder un défi complété
  const markChallengeCompleted = (challengeId: string) => {
    const completed = getCompletedChallenges();
    if (!completed.includes(challengeId)) {
      completed.push(challengeId);
      localStorage.setItem('completedChallenges', JSON.stringify(completed));
    }
  };

  // Vérifier si un défi est complété
  const isChallengeCompleted = (challenge: Challenge): boolean => {
    const completed = getCompletedChallenges();
    if (completed.includes(challenge.id)) return true;

    // Vérifier la condition en temps réel
    let isCompleted = false;
    if (challenge.id.startsWith('score-') || challenge.id === 'test-easy') {
      isCompleted = bestScore >= challenge.target;
    } else if (challenge.id.startsWith('games-')) {
      isCompleted = totalGamesPlayed >= challenge.target;
    }

    // Si complété, le marquer et donner la récompense
    if (isCompleted && !completed.includes(challenge.id)) {
      markChallengeCompleted(challenge.id);
      onReward(challenge.reward);
    }

    return isCompleted;
  };

  // Calculer le progrès d'un défi
  const getChallengeProgress = (challenge: Challenge): number => {
    if (isChallengeCompleted(challenge)) return 100;

    if (challenge.id.startsWith('score-') || challenge.id === 'test-easy') {
      return Math.min((bestScore / challenge.target) * 100, 100);
    } else if (challenge.id.startsWith('games-')) {
      return Math.min((totalGamesPlayed / challenge.target) * 100, 100);
    }
    return 0;
  };

  // Obtenir la valeur actuelle pour un défi
  const getCurrentValue = (challenge: Challenge): number => {
    if (challenge.id.startsWith('score-') || challenge.id === 'test-easy') {
      return bestScore;
    } else if (challenge.id.startsWith('games-')) {
      return totalGamesPlayed;
    }
    return 0;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'text-green-400 border-green-400';
      case 'moyen': return 'text-blue-400 border-blue-400';
      case 'difficile': return 'text-orange-400 border-orange-400';
      case 'expert': return 'text-red-400 border-red-400';
      case 'impossible': return 'text-purple-400 border-purple-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return <Target className="w-4 h-4" />;
      case 'moyen': return <Star className="w-4 h-4" />;
      case 'difficile': return <Flame className="w-4 h-4" />;
      case 'expert': return <Trophy className="w-4 h-4" />;
      case 'impossible': return <Crown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const completedCount = CHALLENGES.filter(challenge => isChallengeCompleted(challenge)).length;
  const totalRewards = CHALLENGES
    .filter(challenge => isChallengeCompleted(challenge))
    .reduce((sum, challenge) => sum + challenge.reward, 0);

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          onClick={onBack}
          variant="outline"
          className="border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Menu
        </Button>
      </div>

      {/* Title & Stats */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          DÉFIS QUOTIDIENS
        </h1>
        <div className="flex justify-center gap-8 text-lg">
          <div className="text-text-secondary">
            <span className="text-primary font-bold">{completedCount}</span>/{CHALLENGES.length} complétés
          </div>
          <div className="text-text-secondary">
            <span className="text-secondary font-bold">{totalRewards}</span> coins gagnés
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {CHALLENGES.map((challenge) => {
          const completed = isChallengeCompleted(challenge);
          const progress = getChallengeProgress(challenge);
          const currentValue = getCurrentValue(challenge);
          
          return (
            <Card 
              key={challenge.id}
              className={`
                relative overflow-hidden border-2 transition-all duration-300
                ${completed 
                  ? 'border-success bg-success/5 shadow-glow-success' 
                  : 'border-wheel-border bg-button-bg hover:border-primary/50 hover:scale-105'
                }
              `}
            >
              {/* Difficulty Badge */}
              <div className="absolute top-4 right-4">
                <Badge 
                  variant="outline" 
                  className={`${getDifficultyColor(challenge.difficulty)} bg-transparent`}
                >
                  {getDifficultyIcon(challenge.difficulty)}
                  <span className="ml-1 capitalize">{challenge.difficulty}</span>
                </Badge>
              </div>

              {/* Completed Badge */}
              {completed && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-success text-game-dark">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complété
                  </Badge>
                </div>
              )}

              <div className="p-6 pt-16">
                {/* Challenge Info */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {challenge.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-muted text-sm">Progrès</span>
                    <span className="text-text-primary font-bold">
                      {currentValue} / {challenge.target}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs text-text-muted">{Math.round(progress)}%</span>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-secondary" />
                    <span className="text-secondary font-bold">{challenge.reward} coins</span>
                  </div>
                  
                  {completed ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <Lock className="w-6 h-6 text-text-muted" />
                  )}
                </div>
              </div>

              {/* Glow Effect for Completed */}
              {completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-success/10 to-transparent pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Current Stats */}
      <div className="mt-8 text-center">
        <Card className="max-w-md mx-auto bg-button-bg border-wheel-border p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Tes Statistiques</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Meilleur Score</div>
              <div className="text-primary font-bold text-xl">{bestScore}</div>
            </div>
            <div>
              <div className="text-text-muted">Parties Jouées</div>
              <div className="text-secondary font-bold text-xl">{totalGamesPlayed}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};