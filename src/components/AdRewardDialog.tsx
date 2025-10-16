import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, Play, Sparkles, Gift, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Ads } from '@/ads/AdService';
import { showRewardedFor } from '@/ads/RewardRouter';

interface AdRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (coins: number) => void;
}

export const AdRewardDialog: React.FC<AdRewardDialogProps> = ({
  isOpen,
  onClose,
  onRewardClaimed
}) => {
  const [isWatching, setIsWatching] = useState(false);
  const { toast } = useToast();

  // Initialiser AdMob
  useEffect(() => {
    Ads.init();
  }, []);

  const handleWatchAd = async () => {
    setIsWatching(true);
    
    const success = await showRewardedFor('coins80', {
      onCoins: (amount) => {
        onRewardClaimed(amount);
        onClose();
      },
      showToast: (title, description, variant) => {
        toast({ title, description, variant });
      },
    });

    setIsWatching(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-button-bg to-button-bg/80 border-2 border-primary/30 max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-primary animate-bounce" />
            Coins Gratuits
            <Gift className="w-6 h-6 text-primary animate-bounce" />
          </DialogTitle>
          <DialogDescription className="text-center text-text-secondary pt-2">
            Regarde une courte publicité et gagne des coins gratuitement !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reward Display */}
          <div className="relative bg-gradient-to-br from-secondary/20 to-primary/20 border-2 border-secondary/50 rounded-xl p-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-secondary/10 to-transparent animate-pulse"></div>
            <Sparkles className="w-8 h-8 text-secondary mx-auto mb-2 animate-spin-slow relative z-10" />
            <div className="flex items-center justify-center gap-2 relative z-10">
              <Coins className="w-10 h-10 text-secondary animate-bounce" />
              <span className="text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                +100
              </span>
            </div>
            <p className="text-text-muted text-sm mt-2 relative z-10">
              Coins à gagner
            </p>
          </div>

          {/* Watch Button */}
          {!isWatching ? (
            <Button
              onClick={handleWatchAd}
              className="w-full bg-gradient-primary hover:scale-105 shadow-glow-primary transition-all duration-300 py-6 text-lg font-bold group"
              size="lg"
              disabled={!Ads.isReady()}
            >
              <Video className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Regarder la pub
              {!Ads.isReady() && Ads.getCooldownRemaining() > 0 && (
                <span className="ml-2 text-sm">({Ads.getCooldownRemaining()}s)</span>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-text-primary font-medium">
                  Publicité en cours...
                </p>
                <p className="text-text-muted text-sm mt-1">
                  Merci de patienter quelques secondes
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-center text-text-muted text-xs">
            💡 Astuce : Regarde des pubs régulièrement pour maximiser tes gains !
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
