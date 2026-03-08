import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X, Loader2 } from 'lucide-react';
import { purchasePremiumNative } from '@/utils/purchaseService';
import { restorePurchases } from '@/utils/restorePurchases';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface PremiumOfferProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoins?: (amount: number) => void;
}

// REWARDS is now generated inside the component to use translations

export const PremiumOffer: React.FC<PremiumOfferProps> = ({ isOpen, onClose, onAddCoins }) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const REWARDS = [
    { emoji: '\u{1F6AB}', title: t.premiumZeroPub, description: t.premiumZeroPubDesc, amount: t.premiumNoPubs, tone: 'special' as const },
    { emoji: '✨', title: t.premiumGoldPulsed, description: t.premiumGoldPulsedDesc, amount: t.premiumExclusive, tone: 'special' as const },
    { emoji: '\u{1F451}', title: t.premiumSeasonVIP, description: t.premiumSeasonVIPDesc, amount: t.premiumAllIncluded, tone: 'secondary' as const },
    { emoji: '\u{1FA99}', title: t.premiumCoins, description: t.premiumCoinsDesc, amount: '+1 000', tone: 'secondary' as const },
    { emoji: '\u{1F6E1}\uFE0F', title: t.shopShieldLabel, description: t.shopShieldProtect, amount: 'x2', tone: 'primary' as const },
    { emoji: '\u{1F3AF}', title: t.shopGreenZonePlus, description: t.shopGreenZoneDesc, amount: 'x2', tone: 'primary' as const },
    { emoji: '\u{1F680}', title: t.premiumStartAt20, description: t.premiumStartAt20Desc, amount: 'x2', tone: 'primary' as const },
  ];

  const handlePurchase = async () => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const result = await purchasePremiumNative(onAddCoins);
      if (result === 'purchased') {
        toast({ title: t.premiumPackActivated, description: t.premiumPackActivatedDesc });
        onClose();
      } else if (result === 'cancelled') {
        // User cancelled — do nothing
      } else {
        toast({ title: t.premiumPurchaseError, description: t.premiumPurchaseRetry, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.premiumPurchaseError, variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await restorePurchases();
      if (result === 'restored') {
        toast({ title: t.premiumRestored });
        onClose();
      } else if (result === 'none') {
        toast({ title: t.premiumNoPurchases, variant: 'destructive' });
      } else {
        toast({ title: t.premiumRestoreError, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Impossible de restaurer les achats pour le moment', variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="sm:max-w-[300px] max-w-[290px] bg-transparent border-none p-0 overflow-hidden shadow-none [&>button]:hidden">
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
          <div className="absolute inset-0 bg-gradient-to-b from-game-darker via-button-bg to-game-darker" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--secondary)/0.1),transparent_60%)]" />

          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 z-10 rounded-full p-1 bg-game-darker/60 border border-wheel-border/20 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center pt-4 pb-2 px-3">
              <div className="relative inline-block mb-1.5">
                <span className="text-3xl drop-shadow-[0_0_12px_hsl(var(--secondary)/0.6)]">{'\u{1F451}'}</span>
                <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-primary animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-text-primary tracking-tight">
                PACK <span className="bg-gradient-primary bg-clip-text text-transparent">PREMIUM</span>
              </h2>
              <div className="w-14 h-0.5 bg-gradient-primary mx-auto mt-1.5 rounded-full opacity-60" />
            </div>

            <div className="px-3 pb-2">
              <div className="space-y-1.5">
                {REWARDS.map((reward, index) => {
                  const isSpecial = reward.tone === 'special';
                  const isSeasonPass = index === 1;
                  const toneClass = isSpecial
                    ? 'border-[hsl(0,85%,60%)]/40 from-[hsl(0,85%,60%)]/20'
                    : reward.tone === 'secondary'
                      ? 'border-secondary/35 from-secondary/15'
                      : 'border-primary/35 from-primary/15';
                  const amountClass = isSpecial
                    ? 'text-[hsl(0,85%,65%)]'
                    : reward.tone === 'secondary' ? 'text-secondary' : 'text-primary';

                  return (
                    <div
                      key={reward.title}
                      className={`relative overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-2 transition-all duration-300 ${toneClass} ${isSpecial || isSeasonPass ? 'ring-1 ring-inset ' + (isSpecial ? 'ring-[hsl(0,85%,60%)]/20' : 'ring-secondary/20') : ''}`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className={`absolute inset-0 ${isSpecial ? 'bg-[radial-gradient(circle_at_left,hsl(0_85%_60%/0.15),transparent_70%)]' : 'bg-[radial-gradient(circle_at_left,hsl(var(--primary)/0.12),transparent_70%)]'}`} />
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-lg ${isSpecial ? 'drop-shadow-[0_0_10px_hsl(0,85%,60%,0.5)]' : 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]'}`}>{reward.emoji}</span>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-black uppercase tracking-wide truncate ${reward.title === 'Or Pulsé' ? '' : 'text-text-primary'}`} style={reward.title === 'Or Pulsé' ? { animation: 'username-gold-pulse 2s ease-in-out infinite' } : undefined}>{reward.title}</p>
                            <p className={`text-[10px] text-text-muted ${isSeasonPass ? 'whitespace-normal leading-tight' : 'truncate'}`}>{reward.description}</p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                            isSpecial
                              ? 'border border-[hsl(0,85%,60%)]/30 bg-[hsl(0,85%,60%)]/20 text-[hsl(0,85%,65%)]'
                              : isSeasonPass
                                ? 'border border-secondary/30 bg-secondary/20 text-secondary'
                                : `border border-wheel-border/25 bg-game-darker/70 ${amountClass}`
                          }`}
                        >
                          {reward.amount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-wheel-border to-transparent" />

            <div className="px-3 py-3 text-center space-y-2.5">
              <div>
                <span className="text-xs text-text-muted line-through mr-2">6,99 &#8364;</span>
                <span className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg">3,99 &#8364;</span>
                <div className="text-[9px] text-text-muted mt-0.5 tracking-wide uppercase">Achat unique - Pas d&apos;abonnement</div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3 text-sm font-extrabold bg-gradient-primary hover:opacity-90 shadow-glow-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-game-dark"
              >
                {isPurchasing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Crown className="w-4 h-4 mr-1.5" />}
                {isPurchasing ? 'Achat en cours...' : 'Débloquer le Pack Premium'}
              </Button>
              <p className="text-[9px] text-text-muted flex items-center justify-center gap-1">
                🔒 Paiement sécurisé
              </p>

              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="text-[10px] text-text-muted/70 hover:text-text-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isRestoring && <Loader2 className="w-3 h-3 animate-spin" />}
                Restaurer les achats
              </button>

              <button onClick={onClose} className="text-[11px] text-text-muted hover:text-text-secondary transition-colors">
                Non merci
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
