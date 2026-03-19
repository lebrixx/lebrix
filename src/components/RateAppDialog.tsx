import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface RateAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RATE_APP_KEY = 'ls_rate_app';
const GAMES_PLAYED_KEY = 'ls_rate_games_count';

export const shouldShowRateDialog = (): boolean => {
  const rateData = JSON.parse(localStorage.getItem(RATE_APP_KEY) || '{}');
  if (rateData.rated || rateData.dismissed) return false;
  const count = parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || '0', 10);
  return count > 0 && count % 10 === 0;
};

export const incrementRateGameCount = () => {
  const count = parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || '0', 10);
  localStorage.setItem(GAMES_PLAYED_KEY, String(count + 1));
};

export const forceShowRate = true;

export const RateAppDialog: React.FC<RateAppDialogProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = React.useState<'ask' | 'rate'>('ask');

  const handleNo = () => {
    // Mark as dismissed (not rated) so it can re-trigger at score 55+
    const rateData = JSON.parse(localStorage.getItem(RATE_APP_KEY) || '{}');
    if (!rateData.rated) {
      localStorage.setItem(RATE_APP_KEY, JSON.stringify({ dismissed: true }));
    }
    setStep('ask');
    onClose();
  };
  const handleYes = () => { setStep('rate'); };

  const handleRate = () => {
    localStorage.setItem(RATE_APP_KEY, JSON.stringify({ rated: true }));
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      window.open('market://details?id=com.bryangouzou.luckystop&reviewId=0', '_blank');
    } else {
      window.open('https://apps.apple.com/app/id6753086875?action=write-review', '_blank');
    }
    setStep('ask');
    onClose();
  };

  const handleLater = () => { setStep('ask'); onClose(); };

  const handleOpenChange = (open: boolean) => {
    if (!open) { setStep('ask'); onClose(); }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-[hsl(var(--game-dark))] border border-[hsl(var(--wheel-border)/0.4)] max-w-[300px] rounded-2xl overflow-hidden p-0 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
        
        {/* Subtle top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[hsl(var(--primary)/0.6)] to-transparent" />

        <div className="px-6 pt-8 pb-6">
          <AlertDialogHeader>
            {step === 'ask' ? (
              <>
                {/* 5 stars row */}
                <div className="flex justify-center gap-1.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-6 h-6 text-secondary fill-secondary opacity-90"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>

                <AlertDialogTitle className="text-center">
                  <span className="text-lg font-semibold text-[hsl(var(--text-primary))] tracking-tight">
                    Tu apprécies Lucky Stop ?
                  </span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-[hsl(var(--text-muted))] pt-2 text-xs leading-relaxed">
                  Aide-nous à nous améliorer en partageant ton avis.
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <div className="flex justify-center gap-1.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-secondary fill-secondary opacity-90" />
                  ))}
                </div>

                <AlertDialogTitle className="text-center">
                  <span className="text-lg font-semibold text-[hsl(var(--text-primary))] tracking-tight">
                    Merci !
                  </span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-[hsl(var(--text-secondary))] pt-3 text-sm leading-relaxed font-medium">
                  Chaque avis nous permet de rendre le jeu encore meilleur pour toi et toute la communauté.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>

          {step === 'ask' ? (
            <div className="flex gap-3 pt-6">
              <Button
                onClick={handleNo}
                variant="ghost"
                className="flex-1 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--wheel-border)/0.15)] py-4 rounded-xl text-sm font-medium transition-all duration-200"
              >
                Non merci
              </Button>
              <Button
                onClick={handleYes}
                className="flex-1 bg-gradient-primary py-4 rounded-xl text-sm font-semibold shadow-[0_2px_12px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_20px_hsl(var(--primary)/0.5)] transition-all duration-200 hover:scale-[1.02]"
              >
                Oui
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pt-6">
              <Button
                onClick={handleRate}
                className="w-full bg-gradient-primary py-4 rounded-xl text-sm font-semibold shadow-[0_2px_12px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_20px_hsl(var(--primary)/0.5)] transition-all duration-200 hover:scale-[1.02]"
              >
                Laisser un avis
              </Button>
              <Button
                onClick={handleLater}
                variant="ghost"
                className="w-full text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--wheel-border)/0.15)] py-3 rounded-xl text-xs font-medium transition-all duration-200"
              >
                Plus tard
              </Button>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
