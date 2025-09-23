import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Coins, Crown, Star } from 'lucide-react';
import { 
  getDailyRewardState, 
  canClaimReward, 
  claimDailyReward, 
  resetDayIfNeeded,
  type DailyReward 
} from '@/utils/dailyRewards';

interface DailyRewardsProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (coins: number, theme?: string) => void;
}

export const DailyRewards: React.FC<DailyRewardsProps> = ({
  isOpen,
  onClose,
  onRewardClaimed
}) => {
  const [rewardState, setRewardState] = useState(getDailyRewardState());
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetDayIfNeeded();
      const state = getDailyRewardState();
      setRewardState(state);
      setCanClaim(canClaimReward());
    }
  }, [isOpen]);

  const handleClaimReward = async () => {
    setClaiming(true);
    
    const result = claimDailyReward();
    if (result) {
      const { reward, newState } = result;
      setRewardState(newState);
      setCanClaim(false);
      
      onRewardClaimed(reward.coins, reward.theme);
      
      // Fermer automatiquement après 2 secondes
      setTimeout(() => {
        onClose();
        setClaiming(false);
      }, 2000);
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
      return <Crown className={`w-6 h-6 ${status === 'claimed' ? 'text-yellow-500' : status === 'available' ? 'text-yellow-400' : 'text-gray-400'}`} />;
    }
    return <Coins className={`w-5 h-5 ${status === 'claimed' ? 'text-green-500' : status === 'available' ? 'text-green-400' : 'text-gray-400'}`} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-dark border-wheel-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-text-primary">
            <Gift className="w-6 h-6 text-primary" />
            Récompenses Journalières
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-sm text-text-muted mb-2">
              Série actuelle: {rewardState.currentStreak}/7 jours
            </div>
            <div className="w-full bg-game-bg rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
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
                    p-3 text-center relative transition-all duration-200
                    ${status === 'claimed' ? 'bg-green-500/20 border-green-500/50' : ''}
                    ${status === 'available' ? 'bg-primary/20 border-primary animate-pulse-glow' : ''}
                    ${status === 'locked' ? 'bg-game-bg border-wheel-border opacity-50' : ''}
                  `}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {getDayIcon(day)}
                    <div className="text-xs text-text-muted">J{day}</div>
                    {day === 7 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 border-yellow-500 text-yellow-500">
                        Thème
                      </Badge>
                    )}
                    {status === 'claimed' && (
                      <Star className="w-3 h-3 text-green-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {canClaim && !claiming && (
            <Card className="bg-gradient-primary/20 border-primary p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-primary" />
                <span className="text-text-primary font-medium">
                  Récompense disponible !
                </span>
              </div>
              <div className="text-text-muted text-sm mb-3">
                Jour {rewardState.currentStreak + 1}: 10 coins
                {rewardState.currentStreak + 1 === 7 && " + Thème Exclusif"}
              </div>
              <Button 
                onClick={handleClaimReward}
                className="bg-gradient-primary hover:scale-105 transition-transform"
              >
                Récupérer
              </Button>
            </Card>
          )}

          {claiming && (
            <Card className="bg-green-500/20 border-green-500 p-4 text-center">
              <div className="text-green-400 font-medium">
                🎉 Récompense récupérée !
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
        </div>
      </DialogContent>
    </Dialog>
  );
};