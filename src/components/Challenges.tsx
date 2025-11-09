import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, CheckCircle, Target, Zap, Timer, MapPin, Skull, Gamepad2, Brain } from 'lucide-react';
import { ModeID } from '@/constants/modes';
import { toast } from 'sonner';
import { BOOSTS, BoostType } from '@/types/boosts';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface ChallengeProgress {
  mode: string;
  currentLevel: number; // 0-9 (paliers 1-10)
  pendingRewards: number[]; // Paliers validés mais non réclamés
  lastCheckedScore: number; // Dernier score vérifié pour éviter plusieurs validations dans une partie
}

interface GamesPlayedProgress {
  currentLevel: number; // Nombre de paliers complétés (infini)
  pendingRewards: BoostType[]; // Boosts en attente
  lastCheckedGames: number; // Dernier nombre de parties vérifié
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
  onBoostReward: (boost: BoostType) => void;
}

const MODE_INFO = {
  [ModeID.CLASSIC]: {
    name: 'Classique',
    icon: Target,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30'
  },
  [ModeID.ARC_CHANGEANT]: {
    name: 'Arc changeant',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30'
  },
  [ModeID.SURVIE_60S]: {
    name: 'Survie 30s',
    icon: Timer,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/30'
  },
  [ModeID.ZONE_MOBILE]: {
    name: 'Zone mobile',
    icon: MapPin,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/30'
  },
  [ModeID.ZONE_TRAITRESSE]: {
    name: 'Zone traîtresse',
    icon: Skull,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    borderColor: 'border-red-400/30'
  },
  [ModeID.MEMOIRE_EXPERT]: {
    name: 'Mémoire (Expert)',
    icon: Brain,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400/30'
  }
};

const MAX_LEVEL = 10;

export const Challenges: React.FC<ChallengesProps> = ({
  onBack,
  currentScore,
  bestScore,
  coins,
  maxSpeedReached,
  directionChanges,
  totalGamesPlayed,
  onReward,
  onBoostReward,
}) => {
  const [, forceUpdate] = useState(0);
  
  // Charger totalGamesPlayed depuis localStorage pour avoir la valeur la plus récente
  const [actualGamesPlayed, setActualGamesPlayed] = useState(totalGamesPlayed);
  
  useEffect(() => {
    const saved = localStorage.getItem('luckyStopGame');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setActualGamesPlayed(data.totalGamesPlayed || 0);
      } catch (e) {
        setActualGamesPlayed(totalGamesPlayed);
      }
    } else {
      setActualGamesPlayed(totalGamesPlayed);
    }
  }, [totalGamesPlayed]);

  // Récupérer la progression depuis localStorage
  const getChallengeProgress = (): Record<string, ChallengeProgress> => {
    const saved = localStorage.getItem('challengeProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration des anciennes données
      Object.keys(parsed).forEach(key => {
        if (!parsed[key].pendingRewards) {
          parsed[key].pendingRewards = [];
          parsed[key].lastCheckedScore = 0;
        }
      });
      return parsed;
    }
    // Initialisation par défaut
    const initial: Record<string, ChallengeProgress> = {};
    Object.keys(ModeID).forEach(key => {
      const mode = ModeID[key as keyof typeof ModeID];
      initial[mode] = { mode, currentLevel: 0, pendingRewards: [], lastCheckedScore: 0 };
    });
    return initial;
  };

  // Sauvegarder la progression
  const saveChallengeProgress = (progress: Record<string, ChallengeProgress>) => {
    localStorage.setItem('challengeProgress', JSON.stringify(progress));
  };

  // Récupérer le meilleur score pour un mode
  const getBestScoreForMode = (mode: string): number => {
    const saved = localStorage.getItem('luckyStopGame');
    if (!saved) return 0;
    const data = JSON.parse(saved);
    return data[`bestScore_${mode}`] || 0;
  };

  // Récupérer/sauvegarder la progression du défi "Parties jouées"
  const getGamesPlayedProgress = (): GamesPlayedProgress => {
    const saved = localStorage.getItem('gamesPlayedProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.pendingRewards) {
        parsed.pendingRewards = [];
        parsed.lastCheckedGames = 0;
      }
      return parsed;
    }
    return { currentLevel: 0, pendingRewards: [], lastCheckedGames: 0 };
  };

  const saveGamesPlayedProgress = (progress: GamesPlayedProgress) => {
    localStorage.setItem('gamesPlayedProgress', JSON.stringify(progress));
  };

  // Obtenir un boost aléatoire
  const getRandomBoost = (): BoostType => {
    const boostTypes: BoostType[] = ['shield', 'bigger_zone', 'start_20'];
    return boostTypes[Math.floor(Math.random() * boostTypes.length)];
  };

  // Vérifier et mettre à jour les défis (UN SEUL palier par partie max)
  const checkAndUpdateChallenges = () => {
    const progress = getChallengeProgress();
    let hasUpdates = false;

    Object.keys(ModeID).forEach(key => {
      const mode = ModeID[key as keyof typeof ModeID];
      const modeProgress = progress[mode];
      const modeBestScore = getBestScoreForMode(mode);

      // Si le score n'a pas changé depuis la dernière vérification, ne rien faire
      if (modeBestScore === modeProgress.lastCheckedScore) {
        return;
      }

      // Vérifier UN SEUL palier suivant
      if (modeProgress.currentLevel < MAX_LEVEL) {
        const nextTarget = (modeProgress.currentLevel + 1) * 10;
        
        if (modeBestScore >= nextTarget && modeBestScore > modeProgress.lastCheckedScore) {
          // Palier atteint ! Ajouter aux récompenses en attente
          modeProgress.pendingRewards.push(nextTarget);
          modeProgress.currentLevel++;
          modeProgress.lastCheckedScore = modeBestScore;
          hasUpdates = true;

          toast.success('🎉 Défi complété !', {
            description: `${MODE_INFO[mode].name} - Score de ${nextTarget} atteint ! Réclamez votre récompense dans les Défis.`,
          });
        }
      }
    });

    if (hasUpdates) {
      saveChallengeProgress(progress);
      forceUpdate(prev => prev + 1);
    }
  };

  // Vérifier et mettre à jour le défi "Parties jouées"
  const checkGamesPlayedChallenge = () => {
    const gamesProgress = getGamesPlayedProgress();
    
    // Si le nombre de parties n'a pas changé, ne rien faire
    if (actualGamesPlayed === gamesProgress.lastCheckedGames) {
      return;
    }

    // Calculer le prochain palier (multiples de 50)
    const nextTarget = (gamesProgress.currentLevel + 1) * 50;
    
    if (actualGamesPlayed >= nextTarget && actualGamesPlayed > gamesProgress.lastCheckedGames) {
      // Palier atteint ! Donner un boost aléatoire
      const randomBoost = getRandomBoost();
      gamesProgress.pendingRewards.push(randomBoost);
      gamesProgress.currentLevel++;
      gamesProgress.lastCheckedGames = actualGamesPlayed;
      
      saveGamesPlayedProgress(gamesProgress);
      forceUpdate(prev => prev + 1);

      toast.success('🎮 Défi Parties complété !', {
        description: `${nextTarget} parties jouées ! Réclamez votre boost dans les Défis.`,
      });
    }
  };

  // Réclamer une récompense
  const claimReward = (mode: string) => {
    const progress = getChallengeProgress();
    const modeProgress = progress[mode];
    
    if (modeProgress.pendingRewards.length > 0) {
      const totalReward = modeProgress.pendingRewards.reduce((sum, r) => sum + r, 0);
      modeProgress.pendingRewards = [];
      saveChallengeProgress(progress);
      onReward(totalReward);
      forceUpdate(prev => prev + 1);
      
      toast.success('💰 Récompense réclamée !', {
        description: `+${totalReward} coins ajoutés à votre compte`,
      });
    }
  };

  // Réclamer les boosts du défi "Parties jouées"
  const claimGamesPlayedReward = () => {
    const gamesProgress = getGamesPlayedProgress();
    
    if (gamesProgress.pendingRewards.length > 0) {
      gamesProgress.pendingRewards.forEach(boost => {
        onBoostReward(boost);
      });
      
      const boostNames = gamesProgress.pendingRewards.map(b => BOOSTS[b].name).join(', ');
      gamesProgress.pendingRewards = [];
      saveGamesPlayedProgress(gamesProgress);
      forceUpdate(prev => prev + 1);
      
      toast.success('🎁 Boost(s) réclamé(s) !', {
        description: `${boostNames} ajouté(s) à votre inventaire`,
      });
    }
  };

  // Vérifier au montage et quand les scores changent
  useEffect(() => {
    checkAndUpdateChallenges();
    checkGamesPlayedChallenge();
  }, [bestScore, actualGamesPlayed]);

  const progress = getChallengeProgress();
  const gamesProgress = getGamesPlayedProgress();

  // Calculer les statistiques globales
  const totalLevelsCompleted = Object.values(progress).reduce(
    (sum, p) => sum + p.currentLevel,
    0
  );
  const totalCoinsEarned = Object.values(progress).reduce((sum, p) => {
    let total = 0;
    for (let i = 1; i <= p.currentLevel; i++) {
      total += i * 10;
    }
    return sum + total;
  }, 0);

  const allModes = Object.keys(ModeID).map(key => ModeID[key as keyof typeof ModeID]);

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
          DÉFIS DE PROGRESSION
        </h1>
        <div className="flex justify-center gap-8 text-lg">
          <div className="text-text-secondary">
            <span className="text-primary font-bold">{totalLevelsCompleted}</span>/{MAX_LEVEL * 5} paliers complétés
          </div>
          <div className="text-text-secondary">
            <span className="text-secondary font-bold">{totalCoinsEarned}</span> coins gagnés
          </div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
        {/* Défi Parties Jouées - Toujours en premier */}
        <Card 
          className="relative overflow-hidden border-2 transition-all duration-300 p-6 border-amber-400/30 bg-amber-400/10 hover:scale-105"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-amber-400/10 text-amber-400">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary">
                Parties jouées
              </h3>
              <p className="text-text-muted text-sm">
                Défi infini - Palier {gamesProgress.currentLevel + 1}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-muted text-sm">Progression</span>
              <span className="text-text-primary font-bold">
                {actualGamesPlayed} / {(gamesProgress.currentLevel + 1) * 50}
              </span>
            </div>
            <Progress 
              value={(actualGamesPlayed / ((gamesProgress.currentLevel + 1) * 50)) * 100} 
              className="h-2 mb-1"
            />
            <div className="text-right">
              <span className="text-xs text-text-muted">
                {Math.round((actualGamesPlayed / ((gamesProgress.currentLevel + 1) * 50)) * 100)}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-wheel-border">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium">
                Paliers: <span className="font-bold text-amber-400">{gamesProgress.currentLevel}</span>
              </span>
            </div>
          </div>

          {/* Pending Rewards / Next Reward */}
          {gamesProgress.pendingRewards.length > 0 ? (
            <div className="mt-3">
              <Button
                onClick={claimGamesPlayedReward}
                className="w-full bg-secondary hover:bg-secondary/80 text-white font-bold"
              >
                🎁 Réclamer {gamesProgress.pendingRewards.length} boost(s)
              </Button>
            </div>
          ) : (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30">
                <span className="text-xs text-text-muted">Récompense:</span>
                <span className="text-sm font-bold text-secondary">1 boost aléatoire</span>
              </div>
            </div>
          )}
        </Card>

        {/* Défis par mode */}
        {allModes.map((mode) => {
          const modeProgress = progress[mode];
          const modeBestScore = getBestScoreForMode(mode);
          const info = MODE_INFO[mode];
          const Icon = info.icon;
          const currentTarget = (modeProgress.currentLevel + 1) * 10;
          const isCompleted = modeProgress.currentLevel >= MAX_LEVEL;
          const progressPercent = isCompleted 
            ? 100 
            : Math.min((modeBestScore / currentTarget) * 100, 100);

          return (
            <Card 
              key={mode}
              className={`
                relative overflow-hidden border-2 transition-all duration-300 p-6
                ${isCompleted 
                  ? 'border-success bg-success/10 shadow-glow-success' 
                  : `${info.borderColor} ${info.bgColor} hover:scale-105`
                }
              `}
            >
              {/* Icon & Mode Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg ${info.bgColor} ${info.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary">
                    {info.name}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {isCompleted ? 'Tous les paliers complétés !' : `Faire un score de ${currentTarget}`}
                  </p>
                </div>
              </div>

              {/* Progress */}
              {!isCompleted && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-muted text-sm">Score actuel</span>
                    <span className="text-text-primary font-bold">
                      {modeBestScore} / {currentTarget}
                    </span>
                  </div>
                  <Progress 
                    value={progressPercent} 
                    className="h-2 mb-1"
                  />
                  <div className="text-right">
                    <span className="text-xs text-text-muted">{Math.round(progressPercent)}%</span>
                  </div>
                </div>
              )}

              {/* Completion Status */}
              <div className="flex items-center justify-between pt-4 border-t border-wheel-border">
                <div className="flex items-center gap-2">
                  <Trophy className={`w-5 h-5 ${isCompleted ? 'text-secondary' : 'text-text-muted'}`} />
                  <span className="text-sm font-medium">
                    Progression: <span className={`font-bold ${isCompleted ? 'text-success' : info.color}`}>
                      {modeProgress.currentLevel}/{MAX_LEVEL}
                    </span>
                  </span>
                </div>
                
                {isCompleted && (
                  <CheckCircle className="w-6 h-6 text-success" />
                )}
              </div>

              {/* Pending Rewards / Next Reward */}
              {modeProgress.pendingRewards.length > 0 ? (
                <div className="mt-3">
                  <Button
                    onClick={() => claimReward(mode)}
                    className="w-full bg-secondary hover:bg-secondary/80 text-white font-bold"
                  >
                    🎁 Réclamer {modeProgress.pendingRewards.reduce((sum, r) => sum + r, 0)} coins
                  </Button>
                </div>
              ) : !isCompleted && (
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30">
                    <span className="text-xs text-text-muted">Récompense:</span>
                    <span className="text-sm font-bold text-secondary">{currentTarget} coins</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 max-w-3xl mx-auto w-full">
        <Card className="bg-button-bg border-wheel-border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary mb-2">
                Comment ça marche ?
              </h3>
              <ul className="text-text-secondary text-sm space-y-2">
                <li>• Chaque mode a 10 paliers de progression (10, 20, 30... jusqu'à 100 points)</li>
                <li>• Atteignez le score demandé dans le mode pour valider un palier</li>
                <li>• Gagnez des coins égaux au score atteint (10 points = 10 coins, 100 points = 100 coins)</li>
                <li>• Les paliers se débloquent automatiquement dès que vous atteignez le score requis</li>
                <li>• Le défi "Parties jouées" est infini : tous les 50 parties, gagnez un boost aléatoire</li>
                <li>• Réclamez vos récompenses en revenant sur cette page après avoir complété un défi</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};