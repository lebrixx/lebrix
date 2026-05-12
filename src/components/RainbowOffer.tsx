import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Loader2, Sparkles, Check } from 'lucide-react';
import { purchaseRainbowNative, loadRainbowProduct } from '@/utils/purchaseRainbowService';
import { hasRainbowUnlocked } from '@/utils/seasonPass';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface RainbowOfferProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}

export const RainbowOffer: React.FC<RainbowOfferProps> = ({ isOpen, onClose, onPurchased }) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [storePrice, setStorePrice] = useState<string | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState<boolean>(hasRainbowUnlocked());

  useEffect(() => {
    if (!isOpen) return;
    setAlreadyOwned(hasRainbowUnlocked());
    let active = true;
    loadRainbowProduct().then((p) => {
      if (active && p?.price) setStorePrice(p.price);
    });
    return () => { active = false; };
  }, [isOpen]);

  const handlePurchase = async () => {
    if (isPurchasing || alreadyOwned) return;
    setIsPurchasing(true);
    try {
      const result = await purchaseRainbowNative();
      if (result === 'purchased') {
        toast({ title: t.rainbowUnlockedTitle, description: t.rainbowUnlockedDesc });
        onPurchased?.();
        onClose();
      } else if (result === 'already_owned') {
        toast({ title: t.alreadyUnlocked, description: t.alreadyUnlockedDesc });
        setAlreadyOwned(true);
        onPurchased?.();
      } else if (result === 'cancelled') {
        // silent
      } else if (result === 'unavailable') {
        toast({ title: t.purchaseError, description: t.tryAgainLater, variant: 'destructive' });
      } else {
        toast({ title: t.purchaseError, description: t.tryAgainLater, variant: 'destructive' });
      }
    } catch {
      toast({ title: t.purchaseError, variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
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

            <div className="text-center pt-5 pb-2 px-4">
              <div className="relative inline-block mb-1.5">
                <Sparkles className="w-6 h-6 text-pink-300 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-text-primary tracking-tight">
                Pseudo <span className="animate-[username-rainbow_3s_linear_infinite]">Multicolore</span>
              </h2>
              <p className="text-[10px] text-text-muted mt-1.5 px-2 leading-snug">
                Ton pseudo s'anime avec toutes les couleurs de l'arc-en-ciel dans le classement.
              </p>
            </div>

            <div className="px-4 pb-2">
              <div className="rounded-xl border border-pink-400/30 bg-game-darker/50 p-3 flex items-center justify-center">
                <span className="text-2xl font-black animate-[username-rainbow_3s_linear_infinite]">
                  TonPseudo
                </span>
              </div>
            </div>

            <div className="mx-4 mt-3 h-px bg-gradient-to-r from-transparent via-wheel-border to-transparent" />

            <div className="px-4 py-3 text-center space-y-2.5">
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                  {storePrice ?? '1,99 €'}
                </span>
                <div className="text-[9px] text-text-muted mt-0.5 tracking-wide uppercase">Achat unique - Pas d'abonnement</div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isPurchasing || alreadyOwned}
                className="w-full py-3 text-sm font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-white disabled:opacity-70"
              >
                {alreadyOwned ? <Check className="w-4 h-4 mr-1.5" /> : isPurchasing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {alreadyOwned ? t.alreadyUnlocked : isPurchasing ? t.purchasing : t.unlockMulticolor}
              </Button>
              <p className="text-[9px] text-text-muted flex items-center justify-center gap-1">
                {t.securePayment}
              </p>

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
