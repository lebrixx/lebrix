import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, CheckCircle, Target, Zap, Timer, MapPin, Skull, Gamepad2, Brain, Calendar, Star, Gift, Coins } from 'lucide-react';
import { ModeID } from '@/constants/modes';
import { toast } from 'sonner';
import { BOOSTS, BoostType } from '@/types/boosts';
import { 
  getTodaysChallenges, 
  getDailyChallengeProgress, 
  claimDailyChallenge as claimDailyChallengeUtil,
  hasPendingDailyChallengeRewards,
  DailyChallenge
} from '@/utils/dailyChallenges';

interface ChallengeProgress {
  mode: string;
  currentLevel: number;
  pendingRewards: number[];
  lastCheckedScore: number;
}

interface GamesPlayedProgress {
  currentLevel: number;
  pendingRewards: BoostType[];
  lastCheckedGames: number;
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
  [ModeID.CLASSIC]: { name: 'Classique', icon: Target, color: 'text-blue-400' },
  [ModeID.ARC_CHANGEANT]: { name: 'Arc changeant', icon: Zap, color: 'text-purple-400' },
  [ModeID.SURVIE_60S]: { name: 'Survie 30s', icon: Timer, color: 'text-orange-400' },
  [ModeID.ZONE_MOBILE]: { name: 'Zone mobile', icon: MapPin, color: 'text-green-400' },
  [ModeID.ZONE_TRAITRESSE]: { name: 'Zone traîtresse', icon: Skull, color: 'text-red-400' },
  [ModeID.MEMOIRE_EXPERT]: { name: 'Mémoire Expert', icon: Brain, color: 'text-cyan-400' }
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
  const [actualGamesPlayed, setActualGamesPlayed] = useState(totalGamesPlayed);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('luckyStopGame');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setActualGamesPlayed(data.totalGamesPlayed || 0);
      } catch (e) {
        setActualGamesPlayed(totalGamesPlayed);
      }
    }
    setDailyChallenges(getTodaysChallenges());
  }, [totalGamesPlayed]);

  const getChallengeProgress = (): Record<string, ChallengeProgress> => {
    const saved = localStorage.getItem('challengeProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(key => {
        if (!parsed[key].pendingRewards) {
          parsed[key].pendingRewards = [];
          parsed[key].lastCheckedScore = 0;
        }
      });
      return parsed;
    }
    const initial: Record<string, ChallengeProgress> = {};
    Object.keys(ModeID).forEach(key => {
      const mode = ModeID[key as keyof typeof ModeID];
      initial[mode] = { mode, currentLevel: 0, pendingRewards: [], lastCheckedScore: 0 };
    });
    return initial;
  };

  const saveChallengeProgress = (progress: Record<string, ChallengeProgress>) => {
    localStorage.setItem('challengeProgress', JSON.stringify(progress));
  };

  const getBestScoreForMode = (mode: string): number => {
    const saved = localStorage.getItem('luckyStopGame');
    if (!saved) return 0;
    const data = JSON.parse(saved);
    return data[`bestScore_${mode}`] || 0;
  };

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

  const getRandomBoost = (): BoostType => {
    const boostTypes: BoostType[] = ['shield', 'bigger_zone', 'start_20'];
    return boostTypes[Math.floor(Math.random() * boostTypes.length)];
  };

  const checkAndUpdateChallenges = () => {
    const progress = getChallengeProgress();
    let hasUpdates = false;

    Object.keys(ModeID).forEach(key => {
      const mode = ModeID[key as keyof typeof ModeID];
      const modeProgress = progress[mode];
      const modeBestScore = getBestScoreForMode(mode);

      if (modeBestScore === modeProgress.lastCheckedScore) return;

      if (modeProgress.currentLevel < MAX_LEVEL) {
        const nextTarget = (modeProgress.currentLevel + 1) * 10;
        
        if (modeBestScore >= nextTarget && modeBestScore > modeProgress.lastCheckedScore) {
          modeProgress.pendingRewards.push(nextTarget);
          modeProgress.currentLevel++;
          modeProgress.lastCheckedScore = modeBestScore;
          hasUpdates = true;

          toast.success('🎉 Défi complété !', {
            description: `${MODE_INFO[mode].name} - Score de ${nextTarget} atteint !`,
          });
        }
      }
    });

    if (hasUpdates) {
      saveChallengeProgress(progress);
      forceUpdate(prev => prev + 1);
    }
  };

  const checkGamesPlayedChallenge = () => {
    const gamesProgress = getGamesPlayedProgress();
    
    if (actualGamesPlayed === gamesProgress.lastCheckedGames) return;

    const nextTarget = (gamesProgress.currentLevel + 1) * 50;
    
    if (actualGamesPlayed >= nextTarget && actualGamesPlayed > gamesProgress.lastCheckedGames) {
      const randomBoost = getRandomBoost();
      gamesProgress.pendingRewards.push(randomBoost);
      gamesProgress.currentLevel++;
      gamesProgress.lastCheckedGames = actualGamesPlayed;
      
      saveGamesPlayedProgress(gamesProgress);
      forceUpdate(prev => prev + 1);

      toast.success('🎮 Défi Parties complété !', {
        description: `${nextTarget} parties jouées !`,
      });
    }
  };

  const claimReward = (mode: string) => {
    const progress = getChallengeProgress();
    const modeProgress = progress[mode];
    
    if (modeProgress.pendingRewards.length > 0) {
      const totalCoins = modeProgress.pendingRewards.reduce((sum, target) => sum + target, 0);
      modeProgress.pendingRewards = [];
      saveChallengeProgress(progress);
      onReward(totalCoins);
      forceUpdate(prev => prev + 1);
      
      toast.success(`+${totalCoins} coins !`);
    }
  };

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
      
      toast.success(`${boostNames} ajouté(s) !`);
    }
  };

  const handleClaimDailyChallenge = (challengeId: string) => {
    const coinsEarned = claimDailyChallengeUtil(challengeId);
    if (coinsEarned > 0) {
      onReward(coinsEarned);
      forceUpdate(prev => prev + 1);
      toast.success(`+${coinsEarned} coins !`);
    }
  };

  useEffect(() => {
    checkAndUpdateChallenges();
    checkGamesPlayedChallenge();
  }, [bestScore, actualGamesPlayed]);

  const progress = getChallengeProgress();
  const gamesProgress = getGamesPlayedProgress();
  const dailyProgress = getDailyChallengeProgress();

  const totalLevelsCompleted = Object.values(progress).reduce((sum, p) => sum + p.currentLevel, 0);
  const allModes = Object.keys(ModeID).map(key => ModeID[key as keyof typeof ModeID]);
  const hasDailyRewards = hasPendingDailyChallengeRewards();

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="outline" size="sm" className="border-wheel-border">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">Défis</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="daily" className="relative">
            <Calendar className="w-4 h-4 mr-2" />
            Quotidiens
            {hasDailyRewards && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="global">
            <Trophy className="w-4 h-4 mr-2" />
            Globaux
          </TabsTrigger>
        </TabsList>

        {/* Daily Challenges Tab */}
        <TabsContent value="daily" className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-text-muted text-sm">3 nouveaux défis chaque jour !</p>
          </div>
          
          <div className="space-y-3">
            {dailyChallenges.map((challenge) => {
              const challengeProgress = dailyProgress.challenges[challenge.id];
              const currentProgress = challengeProgress?.progress || 0;
              const isCompleted = challengeProgress?.completed || false;
              const isClaimed = challengeProgress?.claimed || false;
              const progressPercent = Math.min((currentProgress / challenge.target) * 100, 100);

              return (
                <Card 
                  key={challenge.id}
                  className={`p-4 border transition-all ${
                    isClaimed 
                      ? 'border-text-muted/20 bg-text-muted/5 opacity-60' 
                      : isCompleted 
                        ? 'border-secondary bg-secondary/10' 
                        : 'border-wheel-border bg-button-bg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-secondary/20' : 'bg-primary/10'}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-secondary" />
                      ) : (
                        <Star className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-text-primary text-sm truncate">
                          {challenge.title}
                        </h3>
                        <div className="flex items-center gap-1 text-secondary text-xs font-bold ml-2">
                          <Coins className="w-3 h-3" />
                          {challenge.reward.coins}
                        </div>
                      </div>
                      
                      <p className="text-text-muted text-xs mb-2">{challenge.description}</p>
                      
                      {!isClaimed && (
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercent} className="h-1.5 flex-1" />
                          <span className="text-xs text-text-muted whitespace-nowrap">
                            {currentProgress}/{challenge.target}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCompleted && !isClaimed && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimDailyChallenge(challenge.id)}
                        className="bg-secondary hover:bg-secondary/80 text-xs px-3"
                      >
                        <Gift className="w-3 h-3 mr-1" />
                        Réclamer
                      </Button>
                    )}
                    
                    {isClaimed && (
                      <CheckCircle className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Global Challenges Tab */}
        <TabsContent value="global" className="space-y-4">
          {/* Stats */}
          <div className="flex justify-center gap-6 text-sm mb-4">
            <div className="text-text-muted">
              <span className="text-primary font-bold">{totalLevelsCompleted}</span>/{MAX_LEVEL * 6} paliers
            </div>
            <div className="text-text-muted">
              <span className="text-amber-400 font-bold">{gamesProgress.currentLevel}</span> x50 parties
            </div>
          </div>

          {/* Games Played Challenge - Compact */}
          <Card className="p-4 border-amber-400/30 bg-amber-400/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-text-primary text-sm">Parties jouées</h3>
                  <span className="text-xs text-text-muted">
                    Palier {gamesProgress.currentLevel + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(actualGamesPlayed / ((gamesProgress.currentLevel + 1) * 50)) * 100} 
                    className="h-1.5 flex-1"
                  />
                  <span className="text-xs text-text-muted">
                    {actualGamesPlayed}/{(gamesProgress.currentLevel + 1) * 50}
                  </span>
                </div>
              </div>
              {gamesProgress.pendingRewards.length > 0 ? (
                <Button
                  size="sm"
                  onClick={claimGamesPlayedReward}
                  className="bg-secondary hover:bg-secondary/80 text-xs"
                >
                  🎁 {gamesProgress.pendingRewards.length}
                </Button>
              ) : (
                <span className="text-xs text-secondary">+1 boost</span>
              )}
            </div>
          </Card>

          {/* Mode Challenges - Compact Grid */}
          <div className="grid grid-cols-2 gap-3">
            {allModes.map((mode) => {
              const modeProgress = progress[mode];
              const modeBestScore = getBestScoreForMode(mode);
              const info = MODE_INFO[mode];
              const Icon = info.icon;
              const currentTarget = (modeProgress.currentLevel + 1) * 10;
              const isCompleted = modeProgress.currentLevel >= MAX_LEVEL;
              const progressPercent = isCompleted ? 100 : Math.min((modeBestScore / currentTarget) * 100, 100);
              const hasPending = modeProgress.pendingRewards.length > 0;

              return (
                <Card 
                  key={mode}
                  className={`p-3 border transition-all ${
                    isCompleted 
                      ? 'border-success/50 bg-success/5' 
                      : hasPending
                        ? 'border-secondary bg-secondary/10'
                        : 'border-wheel-border bg-button-bg'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${info.color}`} />
                    <span className="text-xs font-medium text-text-primary truncate">
                      {info.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">
                      {isCompleted ? 'Terminé !' : `Score ${currentTarget}`}
                    </span>
                    <span className={`text-xs font-bold ${info.color}`}>
                      {modeProgress.currentLevel}/{MAX_LEVEL}
                    </span>
                  </div>
                  
                  {!isCompleted && (
                    <Progress value={progressPercent} className="h-1 mb-2" />
                  )}
                  
                  {hasPending ? (
                    <Button
                      size="sm"
                      onClick={() => claimReward(mode)}
                      className="w-full bg-secondary hover:bg-secondary/80 text-xs h-7"
                    >
                      +{modeProgress.pendingRewards.reduce((s, r) => s + r, 0)} coins
                    </Button>
                  ) : isCompleted ? (
                    <div className="flex items-center justify-center gap-1 text-success text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Complété
                    </div>
                  ) : (
                    <div className="text-center text-xs text-text-muted">
                      Récompense: {currentTarget} coins
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Info */}
          <Card className="p-3 bg-button-bg/50 border-wheel-border">
            <p className="text-xs text-text-muted text-center">
              Atteins les scores demandés pour débloquer les paliers. Chaque palier = score en coins !
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
