import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles } from 'lucide-react';

interface PremiumOfferProps {
  isOpen: boolean;
  onClose: () => void;
}

const REWARDS = [
  {
    emoji: '\u{1F451}',
    title: 'Pass Saison Complet',
    description: 'Toutes les recompenses debloquees',
    amount: 'Exclusif',
    tone: 'secondary' as const,
  },
  {
    emoji: '\u{1F48E}',
    title: 'Diamants',
    description: 'Monnaie premium',
    amount: '+30',
    tone: 'primary' as const,
  },
  {
    emoji: '\u{1FA99}',
    title: 'Coins',
    description: 'Pour la boutique du jeu',
    amount: '+1 000',
    tone: 'secondary' as const,
  },
  {
    emoji: '\u{1F6E1}\uFE0F',
    title: 'Bouclier',
    description: "Protege d'une erreur",
    amount: 'x2',
    tone: 'primary' as const,
  },
  {
    emoji: '\u{1F3AF}',
    title: 'Zone verte +',
    description: 'Zone de reussite elargie',
    amount: 'x2',
    tone: 'primary' as const,
  },
  {
    emoji: '\u{1F680}',
    title: 'Demarrage 20',
    description: 'Commence a 20 points',
    amount: 'x2',
    tone: 'primary' as const,
  },
];

export const PremiumOffer: React.FC<PremiumOfferProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[330px] bg-transparent border-none p-0 overflow-hidden shadow-none [&>button]:hidden">
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
          <div className="absolute inset-0 bg-gradient-to-b from-game-darker via-button-bg to-game-darker" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--secondary)/0.1),transparent_60%)]" />

          <div className="relative">
            <div className="text-center pt-5 pb-3 px-4">
              <div className="relative inline-block mb-2">
                <span className="text-4xl drop-shadow-[0_0_12px_hsl(var(--secondary)/0.6)]">{'\u{1F451}'}</span>
                <Sparkles className="absolute -top-1 -right-3 w-4 h-4 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">
                PACK <span className="bg-gradient-primary bg-clip-text text-transparent">PREMIUM</span>
              </h2>
              <div className="w-16 h-0.5 bg-gradient-primary mx-auto mt-2 rounded-full opacity-60" />
            </div>

            <div className="px-4 pb-3">
              <div className="space-y-2">
                {REWARDS.map((reward, index) => {
                  const isExclusive = index === 0;
                  const toneClass = reward.tone === 'secondary' ? 'border-secondary/35 from-secondary/15' : 'border-primary/35 from-primary/15';
                  const amountClass = reward.tone === 'secondary' ? 'text-secondary' : 'text-primary';

                  return (
                    <div
                      key={reward.title}
                      className={`relative overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-2.5 ${toneClass}`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,hsl(var(--primary)/0.12),transparent_70%)]" />
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">{reward.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-text-primary truncate">{reward.title}</p>
                            <p className="text-[9px] text-text-muted truncate">{reward.description}</p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                            isExclusive
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

            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-wheel-border to-transparent" />

            <div className="px-4 py-4 text-center space-y-3">
              <div>
                <span className="text-xs text-text-muted line-through mr-2">7,99 &#8364;</span>
                <span className="text-2xl font-black bg-gradient-primary bg-clip-text text-transparent drop-shadow-lg">3,99 &#8364;</span>
                <div className="text-[9px] text-text-muted mt-0.5 tracking-wide uppercase">Achat unique - Pas d&apos;abonnement</div>
              </div>

              <Button
                onClick={() => console.log('Purchase clicked')}
                className="w-full py-4 text-sm font-extrabold bg-gradient-primary hover:opacity-90 shadow-glow-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-game-dark"
              >
                <Crown className="w-4 h-4 mr-1.5" />
                DEBLOQUER MAINTENANT
              </Button>

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
