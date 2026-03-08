import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
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
    // Just close, don't mark as dismissed permanently so it can ask again later
    setStep('ask');
    onClose();
  };

  const handleYes = () => {
    setStep('rate');
  };

  const handleRate = () => {
    localStorage.setItem(RATE_APP_KEY, JSON.stringify({ rated: true }));
    
    // Open store page
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      window.open('https://apps.apple.com/app/lucky-stop/id6744145937', '_blank');
    } else if (platform === 'android') {
      window.open('https://play.google.com/store/apps/details?id=app.lovable.2dd90aa453b647199c4d45da7e4a8847', '_blank');
    } else {
      // Web fallback
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
      <AlertDialogContent className="bg-button-bg border-wheel-border max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary text-center flex flex-col items-center gap-3">
            <Star className="w-8 h-8 text-secondary fill-secondary" />
            {step === 'ask' ? (
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Aimes-tu le jeu ?
              </span>
            ) : (
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Super ! 🎉
              </span>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-text-secondary pt-2 text-sm">
            {step === 'ask'
              ? "Dis-nous ce que tu penses de Lucky Stop !"
              : "Ton avis nous aide beaucoup. Laisse-nous un commentaire sur le store !"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {step === 'ask' ? (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleNo}
              variant="outline"
              className="flex-1 border-wheel-border hover:bg-button-hover text-text-primary py-6"
            >
              <ThumbsDown className="w-5 h-5 mr-2 text-text-muted" />
              Non
            </Button>
            <Button
              onClick={handleYes}
              className="flex-1 bg-gradient-primary hover:opacity-90 py-6"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Oui !
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleRate}
              className="w-full bg-gradient-primary hover:opacity-90 py-6"
            >
              <Star className="w-5 h-5 mr-2" />
              Mettre un avis ⭐
            </Button>
            <Button
              onClick={handleLater}
              variant="ghost"
              className="w-full hover:bg-primary/10 text-text-muted"
            >
              Plus tard
            </Button>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
