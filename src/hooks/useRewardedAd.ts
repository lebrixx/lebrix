import { useState, useCallback } from 'react';
import { Rewarded, RewardKind } from '@/ads/RewardedService';
import { useToast } from '@/hooks/use-toast';

export const useRewardedAd = () => {
  const [isShowing, setIsShowing] = useState(false);
  const { toast } = useToast();

  const showRewardedAd = useCallback(async (kind: RewardKind): Promise<boolean> => {
    if (isShowing) {
      console.warn('[useRewardedAd] Already showing an ad');
      return false;
    }

    if (!Rewarded.isReady()) {
      const cooldown = Rewarded.getCooldownRemaining();
      if (cooldown > 0) {
        toast({
          title: "Pub en cooldown",
          description: `Réessaye dans ${cooldown} secondes.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: "Pub indisponible",
          description: "La pub n'est pas encore prête. Réessaye dans quelques instants.",
          variant: 'destructive',
        });
      }
      return false;
    }

    setIsShowing(true);

    try {
      const result = await Rewarded.show(kind);

      // Reset state immédiatement après le retour de la promesse
      setIsShowing(false);

      if (result.status === 'rewarded') {
        console.log(`[useRewardedAd] Reward earned for ${kind} (${result.ms}ms)`);
        // Petit délai pour laisser l'UI se mettre à jour après la pub
        await new Promise(r => setTimeout(r, 100));
        return true;
      } else if (result.status === 'closed') {
        toast({
          title: "Pub fermée",
          description: "Tu n'as pas reçu la récompense car la pub n'a pas été complétée.",
          variant: 'destructive',
        });
        return false;
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite. Réessaye plus tard.",
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('[useRewardedAd] Error showing ad:', error);
      setIsShowing(false);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Réessaye plus tard.",
        variant: 'destructive',
      });
      return false;
    }
  }, [isShowing, toast]);

  return {
    showRewardedAd,
    isShowing,
    isReady: () => Rewarded.isReady() && !isShowing,
    getCooldown: () => Rewarded.getCooldownRemaining(),
  };
};
