import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trophy, CheckCircle, Target, Zap, Timer, MapPin, Skull, Gamepad2, Brain, Calendar, Star, Gift, Coins, Flame, Sparkles, HelpCircle, Infinity, Crosshair, Clock } from 'lucide-react';
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
import { notifyChallengeUpdate } from '@/utils/challengeUtils';
import { hasPlayedToday, getTodayResult, getDailyTarget } from '@/utils/dailyChallenge';

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
  onOpenDailyChallenge?: () => void;
}

const MODE_INFO = {
  [ModeID.CLASSIC]: { name: 'Classique', icon: Target, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-600/5' },
  [ModeID.ARC_CHANGEANT]: { name: 'Arc changeant', icon: Zap, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-600/5' },
  [ModeID.SURVIE_60S]: { name: 'Survie 30s', icon: Timer, color: 'text-orange-400', gradient: 'from-orange-500/20 to-orange-600/5' },
  [ModeID.ZONE_MOBILE]: { name: 'Zone mobile', icon: MapPin, color: 'text-green-400', gradient: 'from-green-500/20 to-green-600/5' },
  [ModeID.ZONE_TRAITRESSE]: { name: 'Zone traîtresse', icon: Skull, color: 'text-red-400', gradient: 'from-red-500/20 to-red-600/5' },
  [ModeID.MEMOIRE_EXPERT]: { name: 'Mémoire Expert', icon: Brain, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-cyan-600/5' },
  [ModeID.PONG_CIRCULAIRE]: { name: 'Pong Circulaire', icon: Gamepad2, color: 'text-pink-400', gradient: 'from-pink-500/20 to-pink-600/5' }
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
  onOpenDailyChallenge,
}) => {
  const [, forceUpdate] = useState(0);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // Lire le nombre de parties directement depuis localStorage à chaque rendu
  const getActualGamesPlayed = (): number => {
    const saved = localStorage.getItem('luckyStopGame');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.totalGamesPlayed || 0;
      } catch (e) {
        return totalGamesPlayed;
      }
    }
    return totalGamesPlayed;
  };
  
  const actualGamesPlayed = getActualGamesPlayed();
  
  useEffect(() => {
    setDailyChallenges(getTodaysChallenges());
  }, []);

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

      // Débloquer TOUS les paliers atteints d'un coup
      const unlockedTargets: number[] = [];
      while (modeProgress.currentLevel < MAX_LEVEL) {
        const nextTarget = (modeProgress.currentLevel + 1) * 10;
        if (modeBestScore >= nextTarget) {
          modeProgress.pendingRewards.push(nextTarget);
          modeProgress.currentLevel++;
          unlockedTargets.push(nextTarget);
          hasUpdates = true;
        } else {
          break;
        }
      }
      
      modeProgress.lastCheckedScore = modeBestScore;

      if (unlockedTargets.length > 0) {
        const maxTarget = unlockedTargets[unlockedTargets.length - 1];
        toast.success(`🎉 ${unlockedTargets.length} palier${unlockedTargets.length > 1 ? 's' : ''} débloqué${unlockedTargets.length > 1 ? 's' : ''} !`, {
          description: `${MODE_INFO[mode].name} - Score de ${maxTarget} atteint !`,
        });
      }
    });

    if (hasUpdates) {
      saveChallengeProgress(progress);
      notifyChallengeUpdate(); // Notifier le MainMenu
      forceUpdate(prev => prev + 1);
    }
  };

  const checkGamesPlayedChallenge = () => {
    const gamesProgress = getGamesPlayedProgress();
    
    if (actualGamesPlayed === gamesProgress.lastCheckedGames) return;

    let unlocked = 0;
    while (true) {
      const nextTarget = (gamesProgress.currentLevel + 1) * 50;
      if (actualGamesPlayed >= nextTarget) {
        const randomBoost = getRandomBoost();
        gamesProgress.pendingRewards.push(randomBoost);
        gamesProgress.currentLevel++;
        unlocked++;
      } else {
        break;
      }
    }
    
    gamesProgress.lastCheckedGames = actualGamesPlayed;
    
    if (unlocked > 0) {
      saveGamesPlayedProgress(gamesProgress);
      notifyChallengeUpdate();
      forceUpdate(prev => prev + 1);

      toast.success(`🎮 ${unlocked} palier${unlocked > 1 ? 's' : ''} Parties débloqué${unlocked > 1 ? 's' : ''} !`);
    }
  };

  const claimReward = (mode: string) => {
    const progress = getChallengeProgress();
    const modeProgress = progress[mode];
    
    if (modeProgress.pendingRewards.length > 0) {
      const totalCoins = Math.floor(modeProgress.pendingRewards.reduce((sum, target) => sum + target, 0) / 2);
      modeProgress.pendingRewards = [];
      saveChallengeProgress(progress);
      onReward(totalCoins);
      notifyChallengeUpdate();
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
      notifyChallengeUpdate();
      forceUpdate(prev => prev + 1);
      
      toast.success(`${boostNames} ajouté(s) !`);
    }
  };

  const handleClaimDailyChallenge = (challengeId: string) => {
    const coinsEarned = claimDailyChallengeUtil(challengeId);
    if (coinsEarned > 0) {
      onReward(coinsEarned);
      notifyChallengeUpdate();
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
  const hasGlobalRewards = Object.values(progress).some(p => p.pendingRewards.length > 0) || gamesProgress.pendingRewards.length > 0;
  
  // Calculer combien de défis quotidiens sont complétés
  const dailyCompleted = dailyChallenges.filter(c => dailyProgress.challenges[c.id]?.claimed).length;

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col p-4 pt-8">
      {/* Header avec effet */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="outline" size="sm" className="border-wheel-border hover:bg-primary/10">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Trophy className="w-6 h-6 text-secondary" />
            <Sparkles className="w-3 h-3 text-secondary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Défis
          </h1>
        </div>
      </div>

      {/* Tabs améliorés */}
      <Tabs defaultValue="daily" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-button-bg/50 p-1 rounded-xl">
          <TabsTrigger 
            value="daily" 
            className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 rounded-lg transition-all"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Quotidiens
            {hasDailyRewards && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse shadow-lg shadow-secondary/50" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="global"
            className={`relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 rounded-lg transition-all ${
              hasGlobalRewards ? 'bg-gradient-to-r from-secondary/15 to-primary/10 border border-secondary/40 shadow-[0_0_12px_hsl(var(--secondary)/0.25)] animate-pulse-glow' : ''
            }`}
          >
            <Trophy className={`w-4 h-4 mr-2 ${hasGlobalRewards ? 'text-secondary' : ''}`} />
            <span className={hasGlobalRewards ? 'text-secondary font-bold' : ''}>Globaux</span>
            {hasGlobalRewards && (
              <Gift className="w-3.5 h-3.5 ml-1.5 text-secondary animate-bounce" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* Daily Challenges Tab */}
        <TabsContent value="daily" className="space-y-4 animate-fade-in">
          {/* Défi Précision - Hero Card */}
          {onOpenDailyChallenge && (() => {
            const played = hasPlayedToday();
            const todayResult = getTodayResult();
            const target = getDailyTarget();
            
            return (
              <div 
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
                  played 
                    ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent' 
                    : 'border-secondary/50 bg-gradient-to-br from-secondary/20 via-secondary/5 to-primary/10 shadow-xl shadow-secondary/15'
                }`}
                onClick={onOpenDailyChallenge}
              >
                {/* Effets décoratifs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                {!played && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/5 to-transparent animate-pulse" />
                )}
                
                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* Icône principale */}
                    <div className={`relative p-3 rounded-2xl ${played ? 'bg-primary/20' : 'bg-secondary/20 shadow-lg shadow-secondary/20'}`}>
                      <Crosshair className={`w-7 h-7 ${played ? 'text-primary' : 'text-secondary'}`} />
                      {!played && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-ping" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-text-primary">Défi Précision</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          played ? 'bg-primary/20 text-primary' : 'bg-secondary/30 text-secondary'
                        }`}>
                          {played ? '✓ JOUÉ' : '1 ESSAI'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-text-muted mb-3">
                        Stop le chrono au plus près de la cible. Un seul essai par jour, chaque milliseconde compte !
                      </p>
                      
                      {/* Infos */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-button-bg/80 border border-wheel-border/30">
                          <Crosshair className="w-3 h-3 text-primary" />
                          <span className="text-xs font-semibold text-text-primary">{target.toFixed(3)}</span>
                        </div>
                        
                        {played && todayResult ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-button-bg/80 border border-wheel-border/30">
                            <Clock className="w-3 h-3 text-secondary" />
                            <span className="text-xs font-semibold text-text-primary">Écart : {todayResult.gap.toFixed(3)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/10 border border-secondary/20">
                            <Timer className="w-3 h-3 text-secondary" />
                            <span className="text-xs font-semibold text-secondary">Prêt à jouer</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bouton */}
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onOpenDailyChallenge(); }}
                    className={`w-full mt-4 text-sm font-bold py-2.5 ${
                      played 
                        ? 'bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30' 
                        : 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-lg shadow-secondary/25 text-white'
                    }`}
                    variant={played ? 'outline' : 'default'}
                  >
                    {played ? '📊 Voir le classement' : '🎯 Lancer le défi'}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Header quotidien stylisé */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-4 border border-primary/20">
            <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Flame className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Défis du jour</h3>
                  <p className="text-xs text-text-muted">2 nouveaux défis chaque jour</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30">
                <span className="text-lg font-bold text-secondary">{dailyCompleted}</span>
                <span className="text-xs text-text-muted">/2</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {dailyChallenges.map((challenge, index) => {
              const challengeProgress = dailyProgress.challenges[challenge.id];
              const currentProgress = challengeProgress?.progress || 0;
              const isCompleted = challengeProgress?.completed || false;
              const isClaimed = challengeProgress?.claimed || false;
              const progressPercent = Math.min((currentProgress / challenge.target) * 100, 100);

              return (
                <Card 
                  key={challenge.id}
                  className={`relative overflow-hidden border transition-all duration-300 ${
                    isClaimed 
                      ? 'border-text-muted/10 bg-text-muted/5 opacity-50' 
                      : isCompleted 
                        ? 'border-secondary/50 bg-gradient-to-r from-secondary/10 to-secondary/5 shadow-lg shadow-secondary/10' 
                        : 'border-wheel-border/50 bg-gradient-to-r from-button-bg to-button-bg/50 hover:border-primary/30'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Effet de brillance pour les complétés */}
                  {isCompleted && !isClaimed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent animate-pulse" />
                  )}
                  
                  <div className="relative p-4">
                    <div className="flex items-center gap-3">
                      {/* Icône avec effet */}
                      <div className={`relative p-2.5 rounded-xl ${
                        isClaimed 
                          ? 'bg-text-muted/10' 
                          : isCompleted 
                            ? 'bg-secondary/20' 
                            : 'bg-primary/10'
                      }`}>
                        {isClaimed ? (
                          <CheckCircle className="w-5 h-5 text-text-muted" />
                        ) : isCompleted ? (
                          <>
                            <Gift className="w-5 h-5 text-secondary" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full animate-ping" />
                          </>
                        ) : (
                          <Star className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold text-sm truncate ${isClaimed ? 'text-text-muted' : 'text-text-primary'}`}>
                            {challenge.title}
                          </h3>
                          <div className={`flex items-center gap-1 text-xs font-bold ml-2 px-2 py-0.5 rounded-full ${
                            isClaimed ? 'bg-text-muted/10 text-text-muted' : 'bg-secondary/20 text-secondary'
                          }`}>
                            <Coins className="w-3 h-3" />
                            {challenge.reward.coins}
                          </div>
                        </div>
                        
                        <p className={`text-xs mb-2 ${isClaimed ? 'text-text-muted/50' : 'text-text-muted'}`}>
                          {challenge.description}
                        </p>
                        
                        {!isClaimed && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-button-bg rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCompleted ? 'bg-secondary' : 'bg-primary'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-muted whitespace-nowrap font-medium">
                              {currentProgress}/{challenge.target}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bouton réclamer */}
                      {isCompleted && !isClaimed && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimDailyChallenge(challenge.id)}
                          className="bg-secondary hover:bg-secondary/80 text-xs px-4 shadow-lg shadow-secondary/20 animate-pulse"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          Réclamer
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>



        </TabsContent>

        {/* Global Challenges Tab */}
        <TabsContent value="global" className="space-y-4 animate-fade-in">
          {/* Comment ça marche */}
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Comment ça marche ?
          </button>
          
          {showHowItWorks && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-muted space-y-1">
              <p>• <strong>Parties jouées (∞) :</strong> toutes les 50 parties → 1 boost.</p>
              <p>• <strong>Défis par mode :</strong> paliers de score 10 → 100. Chaque palier atteint débloque des coins à réclamer (5, 10, 15...).</p>
              <p>• Les récompenses restent en attente jusqu'à réclamation.</p>
            </div>
          )}
          
          {/* Stats header */}
          <div className="flex justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm">
                <span className="text-primary font-bold">{totalLevelsCompleted}</span>
                <span className="text-text-muted">/{MAX_LEVEL * 6}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <span className="text-sm">
                <span className="text-amber-400 font-bold">{actualGamesPlayed}</span>
                <span className="text-text-muted"> parties</span>
              </span>
            </div>
          </div>

          {/* Games Played Challenge */}
          <Card className="relative overflow-hidden border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-amber-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="relative p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-400/20 relative">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <Infinity className="w-3 h-3 text-amber-400 absolute -bottom-1 -right-1" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-text-primary text-sm">Parties jouées</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 font-medium">∞</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-medium">
                      Palier {gamesProgress.currentLevel + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-button-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((actualGamesPlayed / ((gamesProgress.currentLevel + 1) * 50)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-text-muted font-medium">
                      {actualGamesPlayed}/{(gamesProgress.currentLevel + 1) * 50}
                    </span>
                  </div>
                </div>
                {gamesProgress.pendingRewards.length > 0 ? (
                  <Button
                    size="sm"
                    onClick={claimGamesPlayedReward}
                    className="bg-secondary hover:bg-secondary/80 text-xs shadow-lg shadow-secondary/20"
                  >
                    🎁 {gamesProgress.pendingRewards.length}
                  </Button>
                ) : (
                  <div className="text-xs text-amber-400 font-medium px-2 py-1 rounded-lg bg-amber-400/10">
                    +1 boost
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Mode Challenges Grid */}
          <div className="grid grid-cols-2 gap-3">
            {allModes.map((mode, index) => {
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
                  className={`relative overflow-hidden border transition-all duration-300 ${
                    isCompleted 
                      ? 'border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 via-emerald-400/5 to-yellow-500/10 shadow-lg shadow-emerald-500/15' 
                      : hasPending
                        ? 'border-secondary/50 bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-lg shadow-secondary/10'
                        : `border-wheel-border/30 bg-gradient-to-br ${info.gradient}`
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Effet de brillance pour les complétés */}
                  {isCompleted && (
                    <>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/15 rounded-full blur-2xl" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 bg-yellow-400/10 rounded-full blur-xl" />
                    </>
                  )}
                  <div className="relative p-3">
                    {/* Header avec icône */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg ${isCompleted ? 'bg-emerald-400/20 shadow-sm shadow-emerald-400/20' : hasPending ? 'bg-secondary/20' : 'bg-white/5'}`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Icon className={`w-4 h-4 ${info.color}`} />
                        )}
                      </div>
                      <span className={`text-xs font-semibold truncate ${isCompleted ? 'text-emerald-400' : 'text-text-primary'}`}>
                        {info.name}
                      </span>
                      {isCompleted && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 font-bold ml-auto">
                          ★ MAX
                        </span>
                      )}
                    </div>
                    
                    {/* Progression */}
                    <div className="mb-2">
                      {isCompleted ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-emerald-400 font-medium">✓ Tous les paliers</span>
                            <span className="text-[10px] font-bold text-emerald-400">{MAX_LEVEL}/{MAX_LEVEL}</span>
                          </div>
                          <div className="h-1.5 bg-button-bg rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 w-full" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold ${info.color}`}>
                              {modeBestScore}/{currentTarget}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Palier {modeProgress.currentLevel + 1}/{MAX_LEVEL}
                            </span>
                          </div>
                          <div className="h-1.5 bg-button-bg rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${hasPending ? 'bg-secondary' : 'bg-primary'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Action */}
                    {hasPending ? (
                      <Button
                        size="sm"
                        onClick={() => claimReward(mode)}
                        className="w-full bg-secondary hover:bg-secondary/80 text-[10px] h-7 shadow-md shadow-secondary/20"
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        +{Math.floor(modeProgress.pendingRewards.reduce((s, r) => s + r, 0) / 2)}
                      </Button>
                    ) : isCompleted ? (
                      <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-md bg-emerald-400/10 border border-emerald-400/20">
                        <Trophy className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">Maîtrisé</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-white/5">
                        <Coins className="w-3 h-3 text-secondary" />
                        <span className="text-[10px] text-text-muted">+{Math.floor(currentTarget / 2)} coins</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
