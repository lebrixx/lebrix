import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Diamond, Check, Gift, Star, Video, Target, Zap, Palette } from 'lucide-react';
import {
  getSeasonPassData,
  addDiamonds,
  PASS_TIERS,
  DECORATIONS,
  getDailyQuests,
  claimDailyQuestReward,
  unlockTier,
  equipDecoration,
  equipUsernameColor,
  getTierCost,
  type SeasonPassData,
} from '@/utils/seasonPass';
import { useToast } from '@/hooks/use-toast';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { supabase } from '@/integrations/supabase/client';
import { getLocalIdentity } from '@/utils/localIdentity';



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
    if (isOpen) setPassData(getSeasonPassData());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => setCooldownRemaining(getCooldown());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isOpen, getCooldown]);

  const dailyQuests = getDailyQuests();
  const bothCompleted = dailyQuests.quest1Completed && dailyQuests.quest2Completed;

  const handleClaimDaily = () => {
    if (claimDailyQuestReward()) {
      setPassData(getSeasonPassData());
      toast({ title: '💎 Diamant obtenu !', description: 'Tu as gagné 1 diamant en complétant les 2 quêtes !' });
    }
  };


  const handleUnlockTier = (tier: number) => {
    if (unlockTier(tier)) {
      const newData = getSeasonPassData();
      setPassData(newData);
      const deco = DECORATIONS.find(d => d.tier === tier);
      toast({ title: '🎉 Décoration débloquée !', description: `Tu as débloqué "${deco?.name}" !` });
    }
  };

  // Construit la chaîne de décorations combinée : "star,purple_name" si les deux sont équipés
  const buildDecorationsString = (data: SeasonPassData): string | null => {
    const parts: string[] = [];
    // Ajouter l'emoji déco si ce n'est pas purple_name ou pulse_name
    if (data.equippedDecoration && data.equippedDecoration !== 'purple_name' && data.equippedDecoration !== 'pulse_name') {
      parts.push(data.equippedDecoration);
    }
    // Ajouter purple_name si la couleur violet est équipée
    if (data.equippedUsernameColor === 'violet') {
      parts.push('purple_name');
    } else if (data.equippedUsernameColor === 'pulse') {
      parts.push('pulse_name');
    }
    return parts.length > 0 ? parts.join(',') : null;
  };

  const syncDecorationToServer = async (data: SeasonPassData) => {
    const { username, deviceId } = getLocalIdentity();
    if (!username) return;
    const decorations = buildDecorationsString(data);
    try {
      const result = await supabase.functions.invoke('sync-decoration', {
        body: { device_id: deviceId, username, decorations }
      });
      console.log('Decoration sync result:', result, '| Decorations string:', decorations);
    } catch (e) {
      console.warn('Decoration sync failed (offline?)', e);
    }
  };

  const handleEquip = (decoId: string | null) => {
    equipDecoration(decoId);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };

  const handleEquipColor = (active: boolean) => {
    equipUsernameColor(active ? 'violet' : null);
    const updated = getSeasonPassData();
    setPassData(updated);
    syncDecorationToServer(updated);
  };


  const handleBuyDiamond = () => {
    if (onSpendCoins && onSpendCoins(1)) {
      const newData = addDiamonds(1);
      setPassData(newData);
      toast({ title: '💎 Diamant acheté !', description: '1 coin → 1 diamant' });
    } else {
      toast({ title: 'Coins insuffisants', description: 'Il te faut au moins 1 coin.', variant: 'destructive' });
    }
  };

  const handleWatchAd = async () => {
    const success = await showRewardedAd('coins80');
    if (success) {
      const newData = addDiamonds(1);
      setPassData(newData);
      toast({ title: '💎 Diamant obtenu !', description: 'Tu as gagné 1 diamant en regardant une pub !' });
    }
  };

  const nextTier = passData.currentTier + 1;
  const nextTierData = PASS_TIERS.find(t => t.tier === nextTier);
  const nextTierCost = nextTierData ? getTierCost(nextTier) : 0;
  const progressPercent = nextTierData ? Math.min(100, (passData.diamonds / nextTierCost) * 100) : 100;

  const unlockedDecorations = DECORATIONS.filter(d => passData.currentTier >= d.tier);
  const equippedDeco = DECORATIONS.find(d => d.id === passData.equippedDecoration);
  const hasVioletUnlocked = passData.currentTier >= 5;
  const isVioletEquipped = passData.equippedUsernameColor === 'violet';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-darker border-wheel-border max-w-sm max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl">
        
        {/* ── HEADER ── */}
        <div className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-secondary/20 blur-2xl rounded-full" />
          
          <div className="relative px-5 pt-5 pb-4">
            {/* Title */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]" />
              <h2 className="text-lg font-extrabold tracking-wide text-text-primary uppercase">
                Pass de Saison
              </h2>
              <Crown className="w-5 h-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]" />
            </div>

            {/* Diamond counter + Watch Ad button */}
            <div className="relative flex items-center bg-game-dark/70 border border-wheel-border/40 rounded-2xl overflow-hidden mb-4 shadow-[0_2px_16px_hsl(var(--primary)/0.12)]">
              {/* Glow left */}
              <div className="absolute left-0 top-0 h-full w-24 bg-primary/8 pointer-events-none" />

              {/* Counter */}
              <div className="flex-1 flex items-center justify-center gap-2.5 py-3">
                <Diamond className="w-5 h-5 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" />
                <span className="text-2xl font-black text-text-primary tracking-tight">{passData.diamonds}</span>
                <span className="text-sm text-text-muted">💎</span>
              </div>

              {/* Separator */}
              <div className="w-px h-8 bg-wheel-border/40 shrink-0" />

              {/* Bouton pub */}
              <button
                onClick={handleWatchAd}
                disabled={isShowing}
                className="relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 mx-1.5 rounded-xl border border-secondary/35 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="w-6 h-6 rounded-lg bg-secondary/25 border border-secondary/50 flex items-center justify-center shrink-0 shadow-[0_0_8px_hsl(var(--secondary)/0.3)]">
                  <Video className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[9px] text-secondary/80 font-bold uppercase tracking-wider">Regarder →</span>
                  <span className="text-xs font-black text-text-primary">+1 💎</span>
                </div>
              </button>
            </div>



          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          
          {/* ═══ PASS CONTENT ═══ */}
          <div className="px-4 pb-6 space-y-3 pt-1">


              {/* Daily Quests — 2 quêtes, 1 💎 quand les 2 sont faites */}
              <div className="relative overflow-hidden rounded-xl border border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent p-3.5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 blur-xl rounded-full" />
                <div className="relative space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <Star className="w-4 h-4 text-secondary" />
                      </div>
                      <span className="font-bold text-sm text-text-primary">Quêtes du jour</span>
                    </div>
                    <span className="text-xs font-bold bg-secondary/20 text-secondary border border-secondary/30 rounded-full px-2 py-0.5">
                      +1 💎 les 2 complétées
                    </span>
                  </div>

                  {/* Quest 1 : Score 25+ */}
                  <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all ${
                    dailyQuests.quest1Completed
                      ? 'border-secondary/40 bg-secondary/10'
                      : 'border-wheel-border/30 bg-game-darker/50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      dailyQuests.quest1Completed ? 'bg-secondary/30' : 'bg-game-dark border border-wheel-border/40'
                    }`}>
                      {dailyQuests.quest1Completed
                        ? <Check className="w-3.5 h-3.5 text-secondary" />
                        : <Target className="w-3.5 h-3.5 text-text-muted" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight ${dailyQuests.quest1Completed ? 'text-secondary' : 'text-text-secondary'}`}>
                        Score de 25+ dans une partie
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">N'importe quel mode</p>
                    </div>
                    {dailyQuests.quest1Completed && (
                      <span className="text-[10px] font-bold text-secondary shrink-0">✓</span>
                    )}
                  </div>

                  {/* Quest 2 : Utiliser un boost */}
                  <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all ${
                    dailyQuests.quest2Completed
                      ? 'border-secondary/40 bg-secondary/10'
                      : 'border-wheel-border/30 bg-game-darker/50'
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      dailyQuests.quest2Completed ? 'bg-secondary/30' : 'bg-game-dark border border-wheel-border/40'
                    }`}>
                      {dailyQuests.quest2Completed
                        ? <Check className="w-3.5 h-3.5 text-secondary" />
                        : <Zap className="w-3.5 h-3.5 text-text-muted" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight ${dailyQuests.quest2Completed ? 'text-secondary' : 'text-text-secondary'}`}>
                        Utiliser un boost en jeu
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">N'importe quel boost ou mode</p>
                    </div>
                    {dailyQuests.quest2Completed && (
                      <span className="text-[10px] font-bold text-secondary shrink-0">✓</span>
                    )}
                  </div>

                  {/* Claim button or status */}
                  {bothCompleted && !dailyQuests.claimed && (
                    <Button
                      onClick={handleClaimDaily}
                      size="sm"
                      className="w-full h-9 bg-gradient-to-r from-secondary to-primary text-game-darker font-black text-xs rounded-xl shadow-[0_0_16px_hsl(var(--secondary)/0.4)]"
                    >
                      <Gift className="w-3.5 h-3.5" /> Récupérer 1 💎
                    </Button>
                  )}
                  {dailyQuests.claimed && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-secondary font-semibold py-1">
                      <Check className="w-3.5 h-3.5" /> Récompense récupérée aujourd'hui !
                    </div>
                  )}
                  {!bothCompleted && !dailyQuests.claimed && (
                    <p className="text-center text-[10px] text-text-muted">
                      {[dailyQuests.quest1Completed, dailyQuests.quest2Completed].filter(Boolean).length}/2 quêtes complétées
                    </p>
                  )}
                </div>
              </div>


              {/* Tiers */}
              <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-0.5 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-secondary" /> Paliers à débloquer
                </h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[22px] top-4 bottom-4 w-px bg-gradient-to-b from-secondary/40 via-wheel-border/20 to-transparent" />

                  <div className="space-y-2">
                    {PASS_TIERS.map((tier, index) => {
                      const isUnlocked = passData.currentTier >= tier.tier;
                      const isNext = tier.tier === passData.currentTier + 1;
                      const cost = getTierCost(tier.tier);
                      const canAfford = passData.diamonds >= cost;
                      const isLast = index === PASS_TIERS.length - 1;

                      return (
                        <div key={tier.tier} className="relative flex items-stretch gap-3">
                          {/* Timeline node */}
                          <div className="flex flex-col items-center shrink-0 z-10">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                              isUnlocked
                                ? 'bg-gradient-to-br from-secondary to-primary text-game-darker shadow-[0_0_14px_hsl(var(--secondary)/0.5)]'
                                : isNext
                                ? 'bg-primary/15 border-2 border-primary/60 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.2)]'
                                : 'bg-game-darker border border-wheel-border/30 text-text-muted/50'
                            }`}>
                              {isUnlocked ? <Check className="w-5 h-5" /> : (
                                <span className="text-[13px] font-black">{tier.tier}</span>
                              )}
                            </div>
                          </div>

                          {/* Card */}
                          <div className={`flex-1 rounded-2xl border overflow-hidden transition-all duration-300 mb-1 ${
                            isUnlocked
                              ? 'border-secondary/25 bg-gradient-to-r from-secondary/8 to-transparent'
                              : isNext
                              ? 'border-primary/35 bg-gradient-to-r from-primary/8 to-transparent shadow-[0_2px_12px_hsl(var(--primary)/0.1)]'
                              : 'border-wheel-border/30 bg-game-dark/30'
                          }`}>
                            <div className="flex items-center gap-3 px-3.5 py-2.5">
                              {/* Big emoji / couleur preview */}
                              <div className={`text-3xl leading-none shrink-0 transition-all duration-300 ${
                                isUnlocked ? 'opacity-100' : 'opacity-80'
                              }`}>
                                {tier.decoration.isColorReward
                                    ? tier.decoration.color === 'pulse'
                                      ? <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.5)] animate-[username-pulse_3s_ease-in-out_infinite]"><Palette className="w-5 h-5 text-white" /></div>
                                      : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)]"><Palette className="w-5 h-5 text-white" /></div>
                                    : (tier.decoration.prefix.trim() || tier.decoration.suffix.trim() || '🎨')
                                }
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`font-bold text-sm leading-tight ${
                                    isUnlocked ? 'text-secondary' : isNext ? 'text-text-primary' : 'text-text-secondary'
                                  }`}>{tier.decoration.name}</span>
                                  {isUnlocked && (
                                    <span className="text-[9px] font-black bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full border border-secondary/30 uppercase tracking-wider">
                                      Débloqué
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] truncate leading-tight ${
                                  isUnlocked ? 'text-secondary/70' : 'text-text-muted'
                                }`}>
                                  {tier.decoration.isColorReward
                                    ? tier.decoration.color === 'pulse'
                                      ? <span className="font-semibold animate-[username-pulse_3s_ease-in-out_infinite]" style={{ color: 'hsl(var(--primary))' }}>TonPseudo pulsé</span>
                                      : <span style={{ color: '#a855f7' }} className="font-semibold">TonPseudo en violet</span>
                                    : tier.decoration.preview.replace('Pseudo', 'TonPseudo')
                                  }
                                </p>
                              </div>

                              {/* Action */}
                              <div className="shrink-0">
                                {isUnlocked ? (
                                  <div className="w-8 h-8 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-secondary" />
                                  </div>
                                ) : isNext ? (
                                  <Button
                                    onClick={() => handleUnlockTier(tier.tier)}
                                    size="sm"
                                    disabled={!canAfford}
                                    className={`h-9 text-xs px-3 rounded-xl font-black flex items-center gap-1 ${
                                      canAfford
                                        ? 'bg-gradient-to-r from-primary to-secondary text-game-darker shadow-[0_0_12px_hsl(var(--primary)/0.35)]'
                                        : 'bg-game-darker text-text-muted border border-wheel-border/40'
                                    }`}
                                  >
                                    <Diamond className="w-3 h-3" /> {cost}
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-0.5 opacity-35">
                                    <Diamond className="w-3 h-3 text-text-muted" />
                                    <span className="text-xs font-bold text-text-muted">{cost}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
