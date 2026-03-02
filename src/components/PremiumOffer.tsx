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

            {/* Rewards list */}
            <div className="px-4 pb-3 space-y-2">
              {/* Star item: Season Pass */}
              <div className="relative group rounded-xl p-3 text-center border border-secondary/40 bg-gradient-to-br from-secondary/15 via-secondary/5 to-primary/10 overflow-hidden transition-all hover:border-secondary/60">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--secondary)/0.15),transparent_70%)]" />
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-secondary/20 border border-secondary/30">
                  <span className="text-[7px] font-black text-secondary uppercase tracking-wider">⭐ Exclusif</span>
                </div>
                <div className="relative flex items-center gap-3">
                  <span className="text-3xl drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]">👑</span>
                  <div className="text-left">
                    <div className="text-xs font-black text-secondary tracking-wide">PASS SAISON COMPLET</div>
                    <div className="text-[9px] text-text-muted">Toutes les récompenses débloquées</div>
                  </div>
                </div>
              </div>

              {/* Two cards: Diamonds + Coins */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative group rounded-xl p-2.5 text-center border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.1),transparent_70%)]" />
                  <div className="relative">
                    <span className="text-2xl block mb-1 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]">💎</span>
                    <div className="text-lg font-black text-primary leading-none">30</div>
                    <div className="text-[9px] font-semibold text-text-muted mt-0.5">Diamants</div>
                  </div>
                </div>
                <div className="relative group rounded-xl p-2.5 text-center border border-secondary/30 bg-gradient-to-b from-secondary/10 to-transparent overflow-hidden transition-all hover:border-secondary/50 hover:shadow-[0_0_12px_hsl(var(--secondary)/0.15)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--secondary)/0.1),transparent_70%)]" />
                  <div className="relative">
                    <span className="text-2xl block mb-1 drop-shadow-[0_0_6px_hsl(var(--secondary)/0.4)]">🪙</span>
                    <div className="text-lg font-black text-secondary leading-none">1 000</div>
                    <div className="text-[9px] font-semibold text-text-muted mt-0.5">Coins</div>
                  </div>
                </div>
              </div>

              {/* Boosts row */}
              <div className="rounded-xl border border-wheel-border/20 bg-button-bg/30 p-2">
                <div className="text-[8px] font-bold text-text-muted uppercase tracking-widest text-center mb-1.5">× 2 de chaque boost</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { emoji: '🛡️', label: 'Bouclier', color: 'primary' },
                    { emoji: '🎯', label: 'Zone+', color: 'success' },
                    { emoji: '🚀', label: 'Start 20', color: 'secondary' },
                  ].map((b, i) => (
                    <div key={i} className="rounded-lg p-1.5 text-center bg-game-darker/60 border border-wheel-border/15 hover:border-primary/30 transition-all">
                      <span className="text-lg block drop-shadow-[0_0_4px_hsl(var(--primary)/0.3)]">{b.emoji}</span>
                      <div className="text-[8px] font-bold text-text-secondary mt-0.5">{b.label}</div>
                    </div>
                  ))}
                </div>
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
