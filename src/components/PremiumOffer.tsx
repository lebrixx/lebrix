import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';

interface PremiumOfferProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumOffer: React.FC<PremiumOfferProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[330px] bg-transparent border-none p-0 overflow-hidden shadow-none [&>button]:hidden">
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-b from-game-darker via-button-bg to-game-darker" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--secondary)/0.1),transparent_60%)]" />

          <div className="relative">
            {/* Header */}
            <div className="text-center pt-5 pb-3 px-4">
              <div className="relative inline-block mb-2">
                <span className="text-4xl drop-shadow-[0_0_12px_hsl(var(--secondary)/0.6)]">👑</span>
                <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">
                PACK <span className="bg-gradient-primary bg-clip-text text-transparent">PREMIUM</span>
              </h2>
              <div className="w-16 h-0.5 bg-gradient-primary mx-auto mt-2 rounded-full opacity-60" />
            </div>

            {/* Rewards grid - 2 columns for main, 3 columns for boosts */}
            <div className="px-4 pb-3 space-y-2">
              {/* Top row: Pass + Diamonds */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative group rounded-xl p-2.5 text-center border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 transition-all">
                  <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,hsl(var(--secondary)/0.08),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-2xl block mb-1">👑</span>
                  <div className="text-[11px] font-bold text-secondary">Pass Saison</div>
                  <div className="text-[9px] text-text-muted">Tout débloqué</div>
                </div>
                <div className="relative group rounded-xl p-2.5 text-center border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all">
                  <div className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-2xl block mb-1">💎</span>
                  <div className="text-[11px] font-bold text-primary">30 Diamants</div>
                  <div className="text-[9px] text-text-muted">Season Pass</div>
                </div>
              </div>

              {/* Middle: Coins - full width highlight */}
              <div className="relative group rounded-xl p-2 text-center border border-secondary/20 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 hover:from-secondary/10 hover:to-secondary/10 transition-all flex items-center justify-center gap-3">
                <span className="text-xl">🪙</span>
                <div className="text-left">
                  <span className="text-xs font-bold text-secondary">1 000 Coins</span>
                  <span className="text-[9px] text-text-muted block">Pour la boutique</span>
                </div>
              </div>

              {/* Bottom: 3 boosts */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { emoji: '🛡️', label: 'Bouclier', qty: '×2' },
                  { emoji: '🎯', label: 'Zone+', qty: '×2' },
                  { emoji: '🚀', label: 'Start 20', qty: '×2' },
                ].map((b, i) => (
                  <div key={i} className="rounded-lg p-2 text-center border border-wheel-border/30 bg-button-bg/50 hover:border-primary/30 transition-all">
                    <span className="text-lg block">{b.emoji}</span>
                    <div className="text-[9px] font-semibold text-text-primary mt-0.5">{b.label}</div>
                    <div className="text-[9px] font-bold text-primary">{b.qty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-wheel-border to-transparent" />

            {/* Price + CTA */}
            <div className="px-4 py-4 text-center space-y-3">
              <div>
                <span className="text-xs text-text-muted line-through mr-2">7,99 €</span>
                <span className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg">
                  3,99 €
                </span>
                <div className="text-[9px] text-text-muted mt-0.5 tracking-wide uppercase">Achat unique · Pas d'abonnement</div>
              </div>

              <Button
                onClick={() => console.log('Purchase clicked - not functional yet')}
                className="w-full py-4 text-sm font-extrabold bg-gradient-primary hover:opacity-90 shadow-glow-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-game-dark"
              >
                <Crown className="w-4 h-4 mr-1.5" />
                DÉBLOQUER MAINTENANT
              </Button>

              <button
                onClick={onClose}
                className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Non merci
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
