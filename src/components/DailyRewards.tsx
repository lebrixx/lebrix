import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Coins, Crown, Star, Sparkles, Zap, Video } from 'lucide-react';
import { Ads } from '@/ads/AdService';
import { showRewardedFor } from '@/ads/RewardRouter';
import { 
  getDailyRewardState, 
  canClaimReward, 
  claimDailyReward, 
  resetDayIfNeeded,
  getNextReward,
  type DailyReward 
} from '@/utils/dailyRewards';
import { BOOSTS } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';

interface DailyRewardsProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (coins: number, theme?: string, boostId?: string) => void;
  currentCoins?: number;
}

export const DailyRewards: React.FC<DailyRewardsProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
  currentCoins = 0,
}) => {
  const [rewardState, setRewardState] = useState(getDailyRewardState());
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyReward | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const { addBoost } = useBoosts();

  // Initialiser AdMob
  useEffect(() => {
    Ads.init();
  }, []);

  // Mettre à jour le chrono chaque seconde
  useEffect(() => {
    if (!isOpen) return;

    const updateCooldown = () => {
      setCooldownRemaining(Ads.getCooldownRemaining());
    };

    // Mise à jour initiale
    updateCooldown();

    // Mettre à jour chaque seconde
    const interval = setInterval(updateCooldown, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      resetDayIfNeeded();
      const state = getDailyRewardState();
      setRewardState(state);
      setCanClaim(canClaimReward());
    }
  }, [isOpen]);

  const handleClaimCoinsWithAd = async () => {
    const success = await showRewardedFor('coins80', {
      onCoins: (amount) => {
        onRewardClaimed(amount);
      },
      showToast: () => {}, // Toast déjà géré par RewardRouter
    });
  };

  const handleClaimReward = async () => {
    setClaiming(true);
    
    const result = claimDailyReward();
    if (result) {
      const { reward, newState } = result;
      setRewardState(newState);
      setCanClaim(false);
      setClaimedReward(reward);
      
      // Ajouter le boost à l'inventaire si c'est un boost
      if (reward.boostId) {
        addBoost(reward.boostId);
      }
      
      onRewardClaimed(reward.coins, reward.theme, reward.boostId);
      
      // Fermer automatiquement après 2.5 secondes
      setTimeout(() => {
        onClose();
        setClaiming(false);
        setClaimedReward(null);
      }, 2500);
    } else {
      setClaiming(false);
    }
  };

  const getDayStatus = (day: number) => {
    if (day <= rewardState.currentStreak) {
      return 'claimed';
    } else if (day === rewardState.currentStreak + 1 && canClaim) {
      return 'available';
    }
    return 'locked';
  };

  const getDayIcon = (day: number) => {
    const status = getDayStatus(day);
    if (day === 7) {
      return <Crown className={`w-6 h-6 ${status === 'claimed' ? 'text-yellow-500' : status === 'available' ? 'text-yellow-400 animate-bounce' : 'text-gray-400'}`} />;
    }
    if (day === 2 || day === 5) {
      return <Zap className={`w-5 h-5 ${status === 'claimed' ? 'text-purple-500' : status === 'available' ? 'text-purple-400 animate-pulse' : 'text-gray-400'}`} />;
    }
    return <Coins className={`w-5 h-5 ${status === 'claimed' ? 'text-green-500' : status === 'available' ? 'text-green-400' : 'text-gray-400'}`} />;
  };

  const nextReward = getNextReward();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-game-dark via-game-dark to-primary/5 border-2 border-primary/30 max-w-md shadow-glow-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-text-primary">
            <Gift className="w-6 h-6 text-primary animate-pulse" />
            Récompenses Journalières
            <Sparkles className="w-5 h-5 text-secondary ml-auto" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span>Série actuelle: <span className="text-primary font-bold">{rewardState.currentStreak}</span>/7 jours</span>
              <Star className="w-4 h-4 text-primary" />
            </div>
            <div className="w-full bg-game-bg rounded-full h-3 shadow-inner border border-wheel-border/50">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500 shadow-glow-primary"
                style={{ width: `${(rewardState.currentStreak / 7) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              
              return (
                <Card 
                  key={day}
                  className={`
                    p-3 text-center relative transition-all duration-300 hover:scale-105
                    ${status === 'claimed' ? 'bg-green-500/20 border-green-500/50 shadow-md' : ''}
                    ${status === 'available' ? 'bg-gradient-to-br from-primary/30 to-secondary/20 border-primary animate-pulse-glow shadow-glow-primary' : ''}
                    ${status === 'locked' ? 'bg-game-bg border-wheel-border opacity-50' : ''}
                  `}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {getDayIcon(day)}
                    <div className="text-xs text-text-muted font-bold">J{day}</div>
                    {day === 7 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 border-yellow-500 text-yellow-500 animate-pulse">
                        Thème
                      </Badge>
                    )}
                    {(day === 2 || day === 5) && (
                      <Badge variant="outline" className="text-xs px-1 py-0 border-purple-500 text-purple-500">
                        Boost
                      </Badge>
                    )}
                    {status === 'claimed' && (
                      <Star className="w-3 h-3 text-green-500 absolute -top-1 -right-1 animate-pulse" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {canClaim && !claiming && (
            <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary p-4 text-center shadow-glow-primary animate-pulse-glow">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-6 h-6 text-primary animate-bounce" />
                <span className="text-text-primary font-bold text-lg">
                  Récompense disponible !
                </span>
              </div>
              <div className="text-text-secondary text-sm mb-3 font-medium">
                Jour {nextReward.day}: 
                {nextReward.boostId ? (
                  <span className="text-purple-400 ml-1 flex items-center justify-center gap-1 mt-1">
                    <Zap className="w-4 h-4" />
                    Boost {BOOSTS[nextReward.boostId].name} {BOOSTS[nextReward.boostId].icon}
                  </span>
                ) : nextReward.theme ? (
                  <span className="text-yellow-400 ml-1 flex items-center justify-center gap-1 mt-1">
                    <Crown className="w-4 h-4" />
                    10 coins + Thème Exclusif
                  </span>
                ) : (
                  <span className="text-green-400 ml-1">10 coins</span>
                )}
              </div>
              <Button 
                onClick={handleClaimReward}
                className="bg-gradient-primary hover:scale-110 transition-all duration-300 shadow-lg"
              >
                <Gift className="w-4 h-4 mr-2" />
                Récupérer
              </Button>
            </Card>
          )}

          {claiming && claimedReward && (
            <Card className="bg-gradient-to-br from-green-500/30 to-primary/20 border-2 border-green-500 p-6 text-center animate-pulse-glow shadow-glow-primary">
              <div className="text-green-400 font-bold text-xl mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 animate-spin" />
                🎉 Récompense récupérée !
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-text-primary text-lg">
                {claimedReward.boostId ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-3xl">{BOOSTS[claimedReward.boostId].icon}</span>
                    <span className="text-purple-400">{BOOSTS[claimedReward.boostId].name}</span>
                  </span>
                ) : claimedReward.theme ? (
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <span className="text-yellow-400">10 coins + Thème Royal</span>
                  </span>
                ) : (
                  <span className="text-green-400">+10 coins</span>
                )}
              </div>
            </Card>
          )}

          {rewardState.claimedToday && !canClaim && !claiming && (
            <Card className="bg-game-bg border-wheel-border p-4 text-center">
              <div className="text-text-muted">
                Reviens demain pour ta prochaine récompense !
              </div>
            </Card>
          )}

          {/* Bouton pour gagner 100 coins via pub */}
          <Card className="bg-gradient-to-br from-green-500/20 to-primary/20 border-2 border-green-500/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-6 h-6 text-green-400" />
                <span className="text-text-primary font-bold">Bonus Publicité</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                +100 coins
              </Badge>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Regarde une pub et gagne 100 coins !
            </p>
            <Button
              onClick={handleClaimCoinsWithAd}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 transition-all duration-300"
              disabled={!Ads.isReady()}
            >
              <Video className="w-4 h-4 mr-2" />
              Regarder une pub
              {!Ads.isReady() && cooldownRemaining > 0 && (
                <span className="ml-1 text-xs">({cooldownRemaining}s)</span>
              )}
            </Button>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};