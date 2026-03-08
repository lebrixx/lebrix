import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Star, Heart, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface RateAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RATE_APP_KEY = 'ls_rate_app';
const GAMES_PLAYED_KEY = 'ls_rate_games_count';

/** Check if the rate dialog should show (every 10 games, unless already rated or dismissed permanently) */
export const shouldShowRateDialog = (): boolean => {
  const rateData = JSON.parse(localStorage.getItem(RATE_APP_KEY) || '{}');
  if (rateData.rated || rateData.dismissed) return false;

  const count = parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || '0', 10);
  return count > 0 && count % 10 === 0;
};

/** Increment the games-played counter for rate dialog logic */
export const incrementRateGameCount = () => {
  const count = parseInt(localStorage.getItem(GAMES_PLAYED_KEY) || '0', 10);
  localStorage.setItem(GAMES_PLAYED_KEY, String(count + 1));
};

/** Force show (for test button) */
export const forceShowRate = true;

export const RateAppDialog: React.FC<RateAppDialogProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = React.useState<'ask' | 'rate'>('ask');

  const handleNo = () => {
    setStep('ask');
    onClose();
  };

  const handleYes = () => {
    setStep('rate');
  };

  const handleRate = () => {
    localStorage.setItem(RATE_APP_KEY, JSON.stringify({ rated: true }));
    
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      window.open('https://apps.apple.com/app/lucky-stop/id6744145937', '_blank');
    } else if (platform === 'android') {
      window.open('https://play.google.com/store/apps/details?id=app.lovable.2dd90aa453b647199c4d45da7e4a8847', '_blank');
    } else {
      window.open('https://apps.apple.com/app/lucky-stop/id6744145937', '_blank');
    }
    
    setStep('ask');
    onClose();
  };

  const handleLater = () => {
    setStep('ask');
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep('ask');
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-button-bg border-0 max-w-[320px] rounded-3xl overflow-hidden p-0 shadow-[0_0_60px_hsl(var(--primary)/0.3),0_0_120px_hsl(var(--secondary)/0.15)]">
        {/* Decorative top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-primary" />
        
        <div className="px-6 pt-6 pb-7 relative">
          {/* Floating background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-gradient-primary opacity-[0.07] blur-3xl pointer-events-none" />
          
          <AlertDialogHeader className="relative z-10">
            {step === 'ask' ? (
              <>
                {/* Animated stars cluster */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center border border-secondary/30 shadow-[0_0_30px_hsl(var(--secondary)/0.3)]">
                      <Heart className="w-10 h-10 text-secondary fill-secondary animate-pulse" style={{ animationDuration: '1.5s' }} />
                    </div>
                    {/* Orbiting stars */}
                    <Star className="absolute -top-2 -right-1 w-5 h-5 text-primary fill-primary animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.2s' }} />
                    <Star className="absolute -bottom-1 -left-2 w-4 h-4 text-secondary fill-secondary animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                    <Star className="absolute top-0 -left-3 w-3 h-3 text-primary/70 fill-primary/70 animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.8s' }} />
                  </div>
                </div>

                <AlertDialogTitle className="text-center">
                  <span className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                    Aimes-tu Lucky Stop ?
                  </span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-text-secondary pt-2 text-sm leading-relaxed">
                  Ton avis compte beaucoup pour nous ! 💫
                </AlertDialogDescription>
              </>
            ) : (
              <>
                {/* Celebration animation */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center border border-success/30 shadow-[0_0_30px_hsl(var(--success)/0.3)]">
                      <span className="text-4xl animate-bounce">🎉</span>
                    </div>
                    <Star className="absolute -top-2 right-0 w-5 h-5 text-secondary fill-secondary animate-spin" style={{ animationDuration: '3s' }} />
                    <Star className="absolute -bottom-1 -left-2 w-4 h-4 text-primary fill-primary animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                </div>

                <AlertDialogTitle className="text-center">
                  <span className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                    Trop cool ! 🥳
                  </span>
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-text-secondary pt-2 text-sm leading-relaxed">
                  Un petit avis sur le store nous aide énormément à améliorer le jeu !
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>

          {step === 'ask' ? (
            <div className="flex gap-3 pt-6 relative z-10">
              <Button
                onClick={handleNo}
                variant="outline"
                className="flex-1 border-wheel-border/50 hover:bg-button-hover text-text-muted py-5 rounded-2xl text-base font-semibold transition-all duration-300 hover:scale-[1.02]"
              >
                <X className="w-5 h-5 mr-2 opacity-60" />
                Non
              </Button>
              <Button
                onClick={handleYes}
                className="flex-1 bg-gradient-primary hover:opacity-90 py-5 rounded-2xl text-base font-bold shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_30px_hsl(var(--primary)/0.6)] transition-all duration-300 hover:scale-[1.03]"
              >
                <Heart className="w-5 h-5 mr-2 fill-current" />
                Oui !
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-6 relative z-10">
              <Button
                onClick={handleRate}
                className="w-full bg-gradient-primary hover:opacity-90 py-5 rounded-2xl text-base font-bold shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_30px_hsl(var(--primary)/0.6)] transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5 fill-current" />
                Mettre un avis ⭐
              </Button>
              <Button
                onClick={handleLater}
                variant="ghost"
                className="w-full hover:bg-primary/10 text-text-muted py-4 rounded-2xl text-sm font-medium transition-all duration-300"
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
