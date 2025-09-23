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
  mode?: 'classic' | 'arc_changeant' | 'survie_60s' | 'zone_mobile' | 'any';
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
  // Défis généraux - Tous modes
  {
    id: 'test-easy',
    title: 'Premier Pas',
    description: 'Atteindre un score de 5 dans n\'importe quel mode',
    target: 5,
    reward: 50,
    difficulty: 'facile',
    mode: 'any'
  },
  {
    id: 'score-30',
    title: 'Précision Maîtrisée',
    description: 'Atteindre 30 points dans n\'importe quel mode',
    target: 30,
    reward: 8,
    difficulty: 'moyen',
    mode: 'any'
  },
  {
    id: 'score-40',
    title: 'Expert du Timing',
    description: 'Atteindre 40 points dans n\'importe quel mode',
    target: 40,
    reward: 12,
    difficulty: 'difficile',
    mode: 'any'
  },
  {
    id: 'score-50',
    title: 'Maître du Cercle',
    description: 'Atteindre 50 points dans n\'importe quel mode',
    target: 50,
    reward: 17,
    difficulty: 'expert',
    mode: 'any'
  },
  {
    id: 'games-50',
    title: 'Persévérant',
    description: 'Jouer 50 parties au total',
    target: 50,
    reward: 5,
    difficulty: 'facile',
    mode: 'any'
  },
  {
    id: 'games-300',
    title: 'Accro du Jeu',
    description: 'Jouer 300 parties au total',
    target: 300,
    reward: 25,
    difficulty: 'expert',
    mode: 'any'
  },

  // Défis Mode Classique
  {
    id: 'classic-25',
    title: 'Classique Maîtrisé',
    description: 'Atteindre 25 points en mode Classique uniquement',
    target: 25,
    reward: 15,
    difficulty: 'moyen',
    mode: 'classic'
  },
  {
    id: 'classic-60',
    title: 'Légende Classique',
    description: 'Atteindre 60 points en mode Classique uniquement',
    target: 60,
    reward: 35,
    difficulty: 'expert',
    mode: 'classic'
  },
  {
    id: 'classic-100',
    title: 'Dieu du Classique',
    description: 'Atteindre 100 points en mode Classique uniquement',
    target: 100,
    reward: 50,
    difficulty: 'impossible',
    mode: 'classic'
  },

  // Défis Arc Changeant  
  {
    id: 'arc-20',
    title: 'Adaptateur Rapide',
    description: 'Atteindre 20 points en mode Arc Changeant',
    target: 20,
    reward: 12,
    difficulty: 'moyen',
    mode: 'arc_changeant'
  },
  {
    id: 'arc-45',
    title: 'Maître de l\'Adaptation',
    description: 'Atteindre 45 points en mode Arc Changeant',
    target: 45,
    reward: 30,
    difficulty: 'expert',
    mode: 'arc_changeant'
  },
  {
    id: 'arc-75',
    title: 'Roi de l\'Adaptation',
    description: 'Atteindre 75 points en mode Arc Changeant',
    target: 75,
    reward: 45,
    difficulty: 'impossible',
    mode: 'arc_changeant'
  },

  // Défis Survie 60s
  {
    id: 'survie-15',
    title: 'Survivant Débutant',
    description: 'Atteindre 15 points en mode Survie 60s',
    target: 15,
    reward: 10,
    difficulty: 'moyen',
    mode: 'survie_60s'
  },
  {
    id: 'survie-30',
    title: 'Survivant Confirmé',
    description: 'Atteindre 30 points en mode Survie 60s',
    target: 30,
    reward: 25,
    difficulty: 'difficile',
    mode: 'survie_60s'
  },
  {
    id: 'survie-50',
    title: 'Survivant Ultime',
    description: 'Atteindre 50 points en mode Survie 60s',
    target: 50,
    reward: 40,
    difficulty: 'expert',
    mode: 'survie_60s'
  },

  // Défis Zone Mobile
  {
    id: 'mobile-20',
    title: 'Chasseur Mobile',
    description: 'Atteindre 20 points en mode Zone Mobile',
    target: 20,
    reward: 12,
    difficulty: 'moyen', 
    mode: 'zone_mobile'
  },
  {
    id: 'mobile-40',
    title: 'Traqueur Expert',
    description: 'Atteindre 40 points en mode Zone Mobile',
    target: 40,
    reward: 28,
    difficulty: 'difficile',
    mode: 'zone_mobile'
  },
  {
    id: 'mobile-60',
    title: 'Chasseur de Zone',
    description: 'Atteindre 60 points en mode Zone Mobile',
    target: 60,
    reward: 35,
    difficulty: 'expert',
    mode: 'zone_mobile'
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

  const getModeDisplay = (mode?: string) => {
    switch (mode) {
      case 'classic': return 'Classique';
      case 'arc_changeant': return 'Arc Changeant';
      case 'survie_60s': return 'Survie 60s';
      case 'zone_mobile': return 'Zone Mobile';
      case 'any': return 'Tous modes';
      default: return 'Tous modes';
    }
  };

  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'classic': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'arc_changeant': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'survie_60s': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'zone_mobile': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'any': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  // Réorganiser les défis : non complétés en premier, complétés en bas
  const sortedChallenges = [...CHALLENGES].sort((a, b) => {
    const aCompleted = isChallengeCompleted(a);
    const bCompleted = isChallengeCompleted(b);
    
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    return 0;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {sortedChallenges.map((challenge) => {
          const completed = isChallengeCompleted(challenge);
          const progress = getChallengeProgress(challenge);
          const currentValue = getCurrentValue(challenge);
          
          return (
            <Card 
              key={challenge.id}
              className={`
                relative overflow-hidden border-2 transition-all duration-500
                ${completed 
                  ? 'border-success/50 bg-success/5 shadow-lg shadow-success/20 opacity-60' 
                  : 'border-wheel-border bg-button-bg hover:border-primary/50 hover:scale-105 hover:shadow-xl shadow-lg'
                }
                backdrop-blur-sm rounded-xl
              `}
            >
              {/* Mode Badge */}
              <div className="absolute top-3 left-3">
                <Badge 
                  variant="outline" 
                  className={`${getModeColor(challenge.mode)} text-xs px-2 py-1 rounded-full font-medium border`}
                >
                  {getModeDisplay(challenge.mode)}
                </Badge>
              </div>

              {/* Difficulty Badge */}
              <div className="absolute top-3 right-3">
                <Badge 
                  variant="outline" 
                  className={`${getDifficultyColor(challenge.difficulty)} bg-transparent text-xs px-2 py-1 rounded-full`}
                >
                  {getDifficultyIcon(challenge.difficulty)}
                  <span className="ml-1 capitalize text-xs">{challenge.difficulty}</span>
                </Badge>
              </div>

              {/* Completed Badge */}
              {completed && (
                <div className="absolute top-12 left-3">
                  <Badge className="bg-success text-game-dark text-xs px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complété
                  </Badge>
                </div>
              )}

              <div className="p-4 pt-16">
                {/* Challenge Info */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-text-primary mb-2 leading-tight">
                    {challenge.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {challenge.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-muted text-sm">Progrès</span>
                    <span className="text-text-primary font-bold text-base">
                      {currentValue} / {challenge.target}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2 rounded-full"
                  />
                  <div className="text-right mt-1">
                    <span className="text-sm text-text-muted">{Math.round(progress)}%</span>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between pt-2 border-t border-wheel-border/30">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-secondary" />
                    <span className="text-secondary font-bold text-sm">{challenge.reward} coins</span>
                  </div>
                  
                  {completed ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Lock className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </div>

              {/* Glow Effect for Completed */}
              {completed && (
                <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent pointer-events-none rounded-xl" />
              )}
              
              {/* Gradient overlay for non-completed */}
              {!completed && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none rounded-xl" />
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