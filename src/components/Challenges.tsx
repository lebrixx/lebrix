import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Target, Zap, Trophy, Clock, Star, CheckCircle, Lock } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  icon: React.ReactNode;
  difficulty: 'facile' | 'moyen' | 'difficile' | 'expert';
  type: 'score' | 'speed' | 'precision' | 'endurance';
}

interface ChallengesProps {
  onBack: () => void;
  currentScore: number;
  bestScore: number;
  coins: number;
  onReward: (coins: number) => void;
}

const CHALLENGES: Challenge[] = [
  // Défis de Score
  {
    id: 'score_5',
    title: 'Premier Pas',
    description: 'Atteignez le score de 5',
    target: 5,
    reward: 20,
    icon: <Target className="w-5 h-5" />,
    difficulty: 'facile',
    type: 'score',
  },
  {
    id: 'score_10',
    title: 'En Rythme',
    description: 'Atteignez le score de 10',
    target: 10,
    reward: 50,
    icon: <Target className="w-5 h-5" />,
    difficulty: 'facile',
    type: 'score',
  },
  {
    id: 'score_25',
    title: 'Maître du Timing',
    description: 'Atteignez le score de 25',
    target: 25,
    reward: 100,
    icon: <Trophy className="w-5 h-5" />,
    difficulty: 'moyen',
    type: 'score',
  },
  {
    id: 'score_50',
    title: 'Réflexes d\'Acier',
    description: 'Atteignez le score de 50',
    target: 50,
    reward: 200,
    icon: <Trophy className="w-5 h-5" />,
    difficulty: 'difficile',
    type: 'score',
  },
  {
    id: 'score_100',
    title: 'Légende Vivante',
    description: 'Atteignez le score de 100',
    target: 100,
    reward: 500,
    icon: <Star className="w-5 h-5" />,
    difficulty: 'expert',
    type: 'score',
  },

  // Défis de Vitesse
  {
    id: 'speed_fast',
    title: 'Vitesse Supersonique',
    description: 'Survivez à 3.0 rad/s de vitesse',
    target: 3.0,
    reward: 75,
    icon: <Zap className="w-5 h-5" />,
    difficulty: 'moyen',
    type: 'speed',
  },
  {
    id: 'speed_extreme',
    title: 'Warp Speed',
    description: 'Survivez à 4.0 rad/s de vitesse',
    target: 4.0,
    reward: 150,
    icon: <Zap className="w-5 h-5" />,
    difficulty: 'difficile',
    type: 'speed',
  },
  {
    id: 'speed_insane',
    title: 'Vitesse de la Lumière',
    description: 'Survivez à 5.0 rad/s de vitesse',
    target: 5.0,
    reward: 300,
    icon: <Zap className="w-5 h-5" />,
    difficulty: 'expert',
    type: 'speed',
  },

  // Défis de Précision
  {
    id: 'precision_10',
    title: 'Oeil de Lynx',
    description: 'Réussissez 10 fois d\'affilée',
    target: 10,
    reward: 80,
    icon: <Target className="w-5 h-5" />,
    difficulty: 'moyen',
    type: 'precision',
  },
  {
    id: 'precision_20',
    title: 'Sniper Élite',
    description: 'Réussissez 20 fois d\'affilée',
    target: 20,
    reward: 180,
    icon: <Target className="w-5 h-5" />,
    difficulty: 'difficile',
    type: 'precision',
  },
  {
    id: 'precision_30',
    title: 'Machine Parfaite',
    description: 'Réussissez 30 fois d\'affilée',
    target: 30,
    reward: 350,
    icon: <Star className="w-5 h-5" />,
    difficulty: 'expert',
    type: 'precision',
  },

  // Défis d'Endurance
  {
    id: 'endurance_directions',
    title: 'Caméléon',
    description: 'Survivez à 15 changements de direction',
    target: 15,
    reward: 120,
    icon: <Clock className="w-5 h-5" />,
    difficulty: 'moyen',
    type: 'endurance',
  },
  {
    id: 'endurance_marathon',
    title: 'Marathon Mental',
    description: 'Survivez à 30 changements de direction',
    target: 30,
    reward: 250,
    icon: <Clock className="w-5 h-5" />,
    difficulty: 'difficile',
    type: 'endurance',
  },
  {
    id: 'endurance_ultimate',
    title: 'Endurance Ultime',
    description: 'Survivez à 50 changements de direction',
    target: 50,
    reward: 500,
    icon: <Star className="w-5 h-5" />,
    difficulty: 'expert',
    type: 'endurance',
  },
];

export const Challenges: React.FC<ChallengesProps> = ({
  onBack,
  currentScore,
  bestScore,
  coins,
  onReward,
}) => {
  const [completedChallenges, setCompletedChallenges] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('luckyStopCompletedChallenges');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculer la vitesse maximum atteinte (approximation basée sur le meilleur score)
  const maxSpeedReached = 1.8 * Math.pow(1.05, bestScore);

  const checkAndCompleteChallenge = (challenge: Challenge) => {
    if (completedChallenges.includes(challenge.id)) return false;

    let isCompleted = false;

    switch (challenge.type) {
      case 'score':
        isCompleted = bestScore >= challenge.target;
        break;
      case 'speed':
        isCompleted = maxSpeedReached >= challenge.target;
        break;
      case 'precision':
      case 'endurance':
        isCompleted = bestScore >= challenge.target;
        break;
    }

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
    switch (challenge.type) {
      case 'score':
        return Math.min((bestScore / challenge.target) * 100, 100);
      case 'speed':
        return Math.min((maxSpeedReached / challenge.target) * 100, 100);
      case 'precision':
      case 'endurance':
        return Math.min((bestScore / challenge.target) * 100, 100);
      default:
        return 0;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'text-green-500';
      case 'moyen': return 'text-yellow-500';
      case 'difficile': return 'text-orange-500';
      case 'expert': return 'text-red-500';
      default: return 'text-text-muted';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moyen': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'difficile': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const groupedChallenges = CHALLENGES.reduce((acc, challenge) => {
    if (!acc[challenge.type]) acc[challenge.type] = [];
    acc[challenge.type].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  const categoryNames = {
    score: 'Défis de Score',
    speed: 'Défis de Vitesse',
    precision: 'Défis de Précision',
    endurance: 'Défis d\'Endurance',
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
          <h1 className="text-3xl font-bold text-primary mb-2">DÉFIS</h1>
          <div className="text-text-secondary">
            Meilleur Score: {bestScore} • Vitesse Max: {maxSpeedReached.toFixed(1)} rad/s
          </div>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Challenges by Category */}
      <div className="max-w-6xl mx-auto space-y-8">
        {Object.entries(groupedChallenges).map(([type, challenges]) => (
          <div key={type} className="animate-fade-in">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
              {type === 'score' && <Trophy className="w-6 h-6" />}
              {type === 'speed' && <Zap className="w-6 h-6" />}
              {type === 'precision' && <Target className="w-6 h-6" />}
              {type === 'endurance' && <Clock className="w-6 h-6" />}
              {categoryNames[type as keyof typeof categoryNames]}
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
                    `}
                  >
                    {/* Challenge Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 text-primary">
                        {challenge.icon}
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
                        <span>Progression</span>
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
                        className={`text-xs ${getDifficultyBadge(challenge.difficulty)}`}
                      >
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
        ))}
      </div>

      {/* Summary Stats */}
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-button-bg border border-wheel-border rounded-lg animate-fade-in">
        <h3 className="text-xl font-bold text-primary mb-4 text-center">Statistiques</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{completedChallenges.length}</div>
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
            <div className="text-2xl font-bold text-accent">{maxSpeedReached.toFixed(1)}</div>
            <div className="text-text-muted text-sm">Max Speed</div>
          </div>
        </div>
      </div>
    </div>
  );
};