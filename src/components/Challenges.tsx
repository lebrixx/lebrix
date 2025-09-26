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
  // Défis généraux
  {
    id: 'test-easy',
    title: 'Premier pas',
    description: 'Atteindre un score de 5 pour tester le système',
    target: 5,
    reward: 50,
    difficulty: 'facile'
  },
  {
    id: 'score-30',
    title: 'Précision maîtrisée',
    description: 'Atteindre un score de 30 points',
    target: 30,
    reward: 8,
    difficulty: 'moyen'
  },
  {
    id: 'score-40',
    title: 'Expert du timing',
    description: 'Atteindre un score de 40 points',
    target: 40,
    reward: 12,
    difficulty: 'difficile'
  },
  {
    id: 'score-50',
    title: 'Maître du cercle',
    description: 'Atteindre un score de 50 points',
    target: 50,
    reward: 17,
    difficulty: 'expert'
  },
  {
    id: 'games-50',
    title: 'Persévérant',
    description: 'Jouer 50 parties',
    target: 50,
    reward: 5,
    difficulty: 'facile'
  },
  {
    id: 'games-300',
    title: 'Accro du jeu',
    description: 'Jouer 300 parties',
    target: 300,
    reward: 25,
    difficulty: 'expert'
  },
  // Défis spécifiques aux modes - CLASSIQUE
  {
    id: 'mode-classic-20',
    title: 'Initié Classique',
    description: 'Atteindre 20 points en mode Classique',
    target: 20,
    reward: 15,
    difficulty: 'facile'
  },
  {
    id: 'mode-classic-50',
    title: 'Vétéran Classique',
    description: 'Atteindre 50 points en mode Classique',
    target: 50,
    reward: 30,
    difficulty: 'moyen'
  },
  {
    id: 'mode-classic-100',
    title: 'Légende Classique',
    description: 'Atteindre 100 points en mode Classique uniquement',
    target: 100,
    reward: 50,
    difficulty: 'impossible'
  },
  
  // Défis spécifiques aux modes - ARC CHANGEANT
  {
    id: 'mode-arc-15',
    title: 'Adaptateur Débutant',
    description: 'Atteindre 15 points en mode Arc Changeant',
    target: 15,
    reward: 12,
    difficulty: 'facile'
  },
  {
    id: 'mode-arc-35',
    title: 'Caméléon du Timing',
    description: 'Atteindre 35 points en mode Arc Changeant',
    target: 35,
    reward: 25,
    difficulty: 'moyen'
  },
  {
    id: 'mode-arc-75',
    title: 'Maître de l\'Adaptation',
    description: 'Atteindre 75 points en mode Arc Changeant uniquement',
    target: 75,
    reward: 45,
    difficulty: 'expert'
  },
  
  // Défis spécifiques aux modes - SURVIE 60S
  {
    id: 'mode-survie-10',
    title: 'Première Survie',
    description: 'Atteindre 10 points en mode Survie 60s',
    target: 10,
    reward: 10,
    difficulty: 'facile'
  },
  {
    id: 'mode-survie-25',
    title: 'Survivant Aguerri',
    description: 'Atteindre 25 points en mode Survie 60s',
    target: 25,
    reward: 20,
    difficulty: 'moyen'
  },
  {
    id: 'mode-survie-40',
    title: 'Survivant Ultime',
    description: 'Atteindre 40 points en mode Survie 60s uniquement',
    target: 40,
    reward: 40,
    difficulty: 'expert'
  },
  
  // Défis spécifiques aux modes - ZONE MOBILE
  {
    id: 'mode-mobile-12',
    title: 'Traqueur Novice',
    description: 'Atteindre 12 points en mode Zone Mobile',
    target: 12,
    reward: 12,
    difficulty: 'facile'
  },
  {
    id: 'mode-mobile-30',
    title: 'Poursuite Experte',
    description: 'Atteindre 30 points en mode Zone Mobile',
    target: 30,
    reward: 22,
    difficulty: 'moyen'
  },
  {
    id: 'mode-mobile-60',
    title: 'Chasseur de Zone',
    description: 'Atteindre 60 points en mode Zone Mobile uniquement',
    target: 60,
    reward: 35,
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

  // Vérifier si un défi est complété et l'activer immédiatement
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

    // Si complété, le marquer et donner la récompense IMMÉDIATEMENT
    if (isCompleted && !completed.includes(challenge.id)) {
      markChallengeCompleted(challenge.id);
      onReward(challenge.reward);
      // Forcer le re-render pour actualiser l'affichage
      setTimeout(() => {
        // Trigger une mise à jour du composant parent si nécessaire
        window.dispatchEvent(new CustomEvent('challengeCompleted', { 
          detail: { challengeId: challenge.id, reward: challenge.reward } 
        }));
      }, 0);
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
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 pt-12">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 max-w-7xl mx-auto">
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
              <div className="absolute top-2 right-2">
                <Badge 
                  variant="outline" 
                  className={`${getDifficultyColor(challenge.difficulty)} bg-transparent text-xs px-2 py-1`}
                >
                  {getDifficultyIcon(challenge.difficulty)}
                  <span className="ml-1 capitalize text-xs">{challenge.difficulty}</span>
                </Badge>
              </div>

              {/* Completed Badge */}
              {completed && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-success text-game-dark text-xs px-2 py-1">
                    <CheckCircle className="w-2 h-2 mr-1" />
                    OK
                  </Badge>
                </div>
              )}

              <div className="p-3 pt-10">
                {/* Challenge Info */}
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-text-primary mb-1 leading-tight">
                    {challenge.title}
                  </h3>
                  <p className="text-text-secondary text-xs leading-snug">
                    {challenge.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-text-muted text-xs">Progrès</span>
                    <span className="text-text-primary font-bold text-sm">
                      {currentValue} / {challenge.target}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-1.5"
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs text-text-muted">{Math.round(progress)}%</span>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-secondary" />
                    <span className="text-secondary font-bold text-xs">{challenge.reward}</span>
                  </div>
                  
                  {completed ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Lock className="w-4 h-4 text-text-muted" />
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