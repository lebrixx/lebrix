import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Diamond, Lock, Check, Gift, Star, Sparkles, Coins, Video } from 'lucide-react';
import {
  getSeasonPassData,
  addDiamonds,
  PASS_TIERS,
  DECORATIONS,
  getDailyChallenge,
  claimDailyChallengeReward,
  unlockTier,
  equipDecoration,
  getTierCost,
  type SeasonPassData,
} from '@/utils/seasonPass';
import { useToast } from '@/hooks/use-toast';
import { useRewardedAd } from '@/hooks/useRewardedAd';

interface SeasonPassProps {
  isOpen: boolean;
  onClose: () => void;
  coins?: number;
  onSpendCoins?: (amount: number) => boolean;
}

export const SeasonPass: React.FC<SeasonPassProps> = ({ isOpen, onClose, coins = 0, onSpendCoins }) => {
  const [passData, setPassData] = useState<SeasonPassData>(getSeasonPassData());
  const { toast } = useToast();
  const { showRewardedAd, isShowing, isReady, getCooldown } = useRewardedAd();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPassData(getSeasonPassData());
    }
  }, [isOpen]);

  // Cooldown timer for ad
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setCooldownRemaining(getCooldown());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen, getCooldown]);

  const dailyChallenge = getDailyChallenge();

  const handleClaimDaily = () => {
    if (claimDailyChallengeReward()) {
      setPassData(getSeasonPassData());
      toast({
        title: '💎 Diamant obtenu !',
        description: 'Tu as gagné 1 diamant grâce au défi quotidien !',
      });
    }
  };

  const handleUnlockTier = (tier: number) => {
    if (unlockTier(tier)) {
      const newData = getSeasonPassData();
      setPassData(newData);
      const deco = DECORATIONS.find(d => d.tier === tier);
      toast({
        title: '🎉 Décoration débloquée !',
        description: `Tu as débloqué "${deco?.name}" !`,
      });
    }
  };

  const handleEquip = (decoId: string | null) => {
    equipDecoration(decoId);
    setPassData(getSeasonPassData());
  };

  const handleBuyDiamond = () => {
    if (onSpendCoins && onSpendCoins(1)) {
      const newData = addDiamonds(1);
      setPassData(newData);
      toast({
        title: '💎 Diamant acheté !',
        description: '1 coin → 1 diamant',
      });
    } else {
      toast({
        title: 'Coins insuffisants',
        description: 'Il te faut au moins 1 coin.',
        variant: 'destructive',
      });
    }
  };

  const handleWatchAd = async () => {
    const success = await showRewardedAd('coins80');
    if (success) {
      const newData = addDiamonds(1);
      setPassData(newData);
      toast({
        title: '💎 Diamant obtenu !',
        description: 'Tu as gagné 1 diamant en regardant une pub !',
      });
    }
  };

  // Progress to next tier
  const nextTier = passData.currentTier + 1;
  const nextTierData = PASS_TIERS.find(t => t.tier === nextTier);
  const nextTierCost = nextTierData ? getTierCost(nextTier) : 0;
  const progressPercent = nextTierData
    ? Math.min(100, (passData.diamonds / nextTierCost) * 100)
    : 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-button-bg border-wheel-border max-w-md max-h-[85vh] overflow-hidden p-0 gap-0">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-b from-secondary/20 to-transparent px-5 pt-5 pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-6 h-6 text-secondary" />
            <h2 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Pass de Saison
            </h2>
          </div>
          
          {/* Diamond counter */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-game-darker/60 rounded-full px-4 py-1.5 border border-wheel-border">
              <Diamond className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-lg">{passData.diamonds}</span>
              <span className="text-text-muted text-xs">diamants</span>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTierData && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Tier {passData.currentTier}</span>
                <span>Tier {nextTier}</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-game-darker" />
              <p className="text-center text-xs text-text-muted mt-1">
                {passData.diamonds}/{nextTierCost} 💎 pour le prochain palier
              </p>
            </div>
          )}
          {!nextTierData && passData.currentTier > 0 && (
            <p className="text-center text-xs text-secondary mt-2 font-medium">
              ✨ Pass complété ! Toutes les décorations débloquées !
            </p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-5 space-y-4" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {/* Daily Challenge Card */}
          <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-sm text-text-primary">Défi Quotidien</span>
              <Badge variant="outline" className="text-[10px] border-secondary/40 text-secondary ml-auto px-1.5 py-0">
                +1 💎
              </Badge>
            </div>
            
            <p className="text-text-secondary text-xs mb-2">{dailyChallenge.description}</p>
            
            <div className="flex items-center gap-2">
              <Progress 
                value={Math.min(100, (dailyChallenge.progress / dailyChallenge.target) * 100)} 
                className="h-2 flex-1 bg-game-darker" 
              />
              <span className="text-xs text-text-muted font-mono min-w-[40px] text-right">
                {dailyChallenge.progress}/{dailyChallenge.target}
              </span>
            </div>
            
            {dailyChallenge.completed && !dailyChallenge.claimed && (
              <Button
                onClick={handleClaimDaily}
                size="sm"
                className="w-full mt-2 bg-gradient-to-r from-secondary to-primary text-game-darker font-bold text-xs h-8"
              >
                <Gift className="w-3.5 h-3.5 mr-1" />
                Récupérer le diamant !
              </Button>
            )}
            
            {dailyChallenge.claimed && (
              <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-secondary">
                <Check className="w-3.5 h-3.5" />
                <span>Récompense récupérée !</span>
              </div>
            )}
          </div>

          {/* Obtenir des diamants */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <Diamond className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-text-primary">Obtenir des diamants</span>
            </div>
            
            <div className="flex gap-2">
              {/* Acheter avec coins */}
              <Button
                onClick={handleBuyDiamond}
                size="sm"
                variant="outline"
                disabled={coins < 1}
                className="flex-1 h-9 text-xs border-secondary/40 hover:bg-secondary/10 gap-1.5"
              >
                <Coins className="w-3.5 h-3.5 text-secondary" />
                <span>1 coin → 1 💎</span>
              </Button>
              
              {/* Regarder une pub */}
              <Button
                onClick={handleWatchAd}
                size="sm"
                disabled={isShowing || !isReady() || cooldownRemaining > 0}
                className="flex-1 h-9 text-xs bg-gradient-to-r from-primary to-secondary text-game-darker font-bold gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Pub → 1 💎'}
              </Button>
            </div>
            
            <p className="text-[10px] text-text-muted text-center mt-2">
              <Sparkles className="w-3 h-3 inline mr-0.5 text-primary" />
              +1 💎 par partie jouée
            </p>
          </div>

          {/* Tiers list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-secondary" />
              Décorations de pseudo
            </h3>
            
            {/* Unequip button */}
            {passData.equippedDecoration && (
              <Button
                onClick={() => handleEquip(null)}
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-text-muted hover:text-text-primary border border-dashed border-wheel-border"
              >
                Retirer la décoration
              </Button>
            )}
            
            {PASS_TIERS.map((tier) => {
              const isUnlocked = passData.currentTier >= tier.tier;
              const isNext = tier.tier === passData.currentTier + 1;
              const isEquipped = passData.equippedDecoration === tier.decoration.id;
              const cost = getTierCost(tier.tier);
              const canAfford = passData.diamonds >= cost;
              const isPrevUnlocked = tier.tier === 1 || passData.currentTier >= tier.tier - 1;
              
              return (
                <div
                  key={tier.tier}
                  className={`
                    relative rounded-xl border p-3 transition-all duration-300
                    ${isEquipped 
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]' 
                      : isUnlocked 
                        ? 'border-secondary/30 bg-secondary/5' 
                        : isNext 
                          ? 'border-wheel-border bg-game-darker/40' 
                          : 'border-wheel-border/50 bg-game-darker/20 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Tier number */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${isUnlocked 
                        ? 'bg-gradient-to-br from-secondary to-primary text-game-darker' 
                        : 'bg-game-darker border border-wheel-border text-text-muted'
                      }
                    `}>
                      {isUnlocked ? <Check className="w-3.5 h-3.5" /> : tier.tier}
                    </div>
                    
                    {/* Decoration info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text-primary">{tier.decoration.name}</span>
                        {isEquipped && (
                          <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 px-1.5 py-0">
                            Équipé
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs mt-0.5 truncate">
                        {tier.decoration.preview.replace('Pseudo', '───')}
                      </p>
                    </div>
                    
                    {/* Action */}
                    <div className="shrink-0">
                      {isUnlocked ? (
                        !isEquipped ? (
                          <Button
                            onClick={() => handleEquip(tier.decoration.id)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-secondary/40 text-secondary hover:bg-secondary/10 px-2.5"
                          >
                            Équiper
                          </Button>
                        ) : null
                      ) : isNext && isPrevUnlocked ? (
                        <Button
                          onClick={() => handleUnlockTier(tier.tier)}
                          size="sm"
                          disabled={!canAfford}
                          className={`h-7 text-xs px-2.5 ${
                            canAfford 
                              ? 'bg-gradient-to-r from-primary to-secondary text-game-darker font-bold' 
                              : 'bg-game-darker text-text-muted border border-wheel-border'
                          }`}
                        >
                          <Diamond className="w-3 h-3 mr-1" />
                          {cost}
                        </Button>
                      ) : (
                        <Lock className="w-4 h-4 text-text-muted/40" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
