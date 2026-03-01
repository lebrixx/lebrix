import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Gem, Coins, Shield, Target, Rocket, Sparkles, Check, X } from 'lucide-react';

interface PremiumOfferProps {
  isOpen: boolean;
  onClose: () => void;
}

const rewards = [
  {
    icon: <Crown className="w-6 h-6 text-yellow-400" />,
    emoji: '👑',
    label: 'Pass Saison complet',
    desc: 'Tous les paliers débloqués',
  },
  {
    icon: <Gem className="w-6 h-6 text-cyan-400" />,
    emoji: '💎',
    label: '30 Diamants',
    desc: 'Pour le Season Pass',
  },
  {
    icon: <Coins className="w-6 h-6 text-yellow-300" />,
    emoji: '🪙',
    label: '1 000 Coins',
    desc: 'Pour la boutique',
  },
  {
    icon: <Shield className="w-5 h-5 text-blue-400" />,
    emoji: '🛡️',
    label: '2x Bouclier',
    desc: 'Protège d\'une erreur',
  },
  {
    icon: <Target className="w-5 h-5 text-green-400" />,
    emoji: '🎯',
    label: '2x Zone élargie',
    desc: 'Zone verte plus grande',
  },
  {
    icon: <Rocket className="w-5 h-5 text-orange-400" />,
    emoji: '🚀',
    label: '2x Démarrage +20',
    desc: 'Commence à 20 points',
  },
];

export const PremiumOffer: React.FC<PremiumOfferProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[320px] bg-button-bg border-wheel-border p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-yellow-500/20 via-secondary/20 to-primary/20 p-3 pb-2 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(45_100%_60%/0.15),transparent_70%)]" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-2 shadow-[0_0_20px_hsl(45_100%_50%/0.5)] animate-pulse">
              <Sparkles className="w-5 h-5 text-game-dark" />
            </div>
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Pack Premium
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tout débloquer d'un coup 🔥
            </p>
          </div>
        </div>

        {/* Rewards list */}
        <div className="px-5 py-4 space-y-2.5">
          {rewards.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-game-darker/50 rounded-xl px-3.5 py-2.5 border border-wheel-border/40 hover:border-primary/40 transition-colors"
            >
              <span className="text-xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary">{r.label}</div>
                <div className="text-xs text-text-muted">{r.desc}</div>
              </div>
              <Check className="w-4 h-4 text-success shrink-0" />
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="px-5 pb-5 pt-1 space-y-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-text-muted line-through">7,99 €</span>
              <span className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-secondary bg-clip-text text-transparent">
                3,99 €
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">Achat unique • Pas d'abonnement</p>
          </div>

          <Button
            onClick={() => {
              // TODO: IAP integration
              console.log('Purchase clicked - not functional yet');
            }}
            className="w-full py-5 text-base font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-game-dark hover:from-yellow-400 hover:to-yellow-400 shadow-[0_0_20px_hsl(45_100%_50%/0.4)] hover:shadow-[0_0_30px_hsl(45_100%_50%/0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Crown className="w-5 h-5 mr-2" />
            Débloquer maintenant
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-sm text-text-muted hover:text-text-primary hover:bg-transparent"
          >
            Non merci
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
