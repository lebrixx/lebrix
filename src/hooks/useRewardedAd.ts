import { useState, useCallback, useEffect } from 'react';
import { Rewarded, RewardKind, REWARDED_COOLDOWN_EVENT } from '@/ads/RewardedService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, translations } from '@/hooks/useLanguage';

export const useRewardedAd = () => {
  const [isShowing, setIsShowing] = useState(false);
  const [cooldownTick, setCooldownTick] = useState(0);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  // Écouter les événements de changement de cooldown
  useEffect(() => {
    const handleCooldownChange = () => {
      setCooldownTick(prev => prev + 1);
    };
    
    window.addEventListener(REWARDED_COOLDOWN_EVENT, handleCooldownChange);
    return () => window.removeEventListener(REWARDED_COOLDOWN_EVENT, handleCooldownChange);
  }, []);

  const showRewardedAd = useCallback(async (kind: RewardKind): Promise<boolean> => {
    if (isShowing) {
      console.warn('[useRewardedAd] Already showing an ad');
      return false;
    }

    if (!Rewarded.isReady()) {
      const cooldown = Rewarded.getCooldownRemaining();
      if (cooldown > 0) {
        toast({
          title: t.adCooldownTitle,
          description: t.adCooldownDesc.replace('{time}', String(cooldown)),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t.adUnavailableTitle,
          description: t.adUnavailableDesc,
          variant: 'destructive',
        });
      }
      return false;
    }

    setIsShowing(true);

    try {
      const result = await Rewarded.show(kind);

      setIsShowing(false);

      if (result.status === 'rewarded') {
        console.log(`[useRewardedAd] Reward earned for ${kind} (${result.ms}ms)`);
        await new Promise(r => setTimeout(r, 100));
        return true;
      } else if (result.status === 'closed') {
        toast({
          title: t.adClosedTitle,
          description: t.adClosedDesc,
          variant: 'destructive',
        });
        return false;
      } else {
        toast({
          title: t.errorTitle,
          description: t.errorGenericDesc,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('[useRewardedAd] Error showing ad:', error);
      setIsShowing(false);
      toast({
        title: t.errorTitle,
        description: t.errorGenericDesc,
        variant: 'destructive',
      });
      return false;
    }
  }, [isShowing, toast, t]);

  const getCooldown = useCallback(() => {
    return Rewarded.getCooldownRemaining();
  }, [cooldownTick]);

  const isReady = useCallback(() => {
    return Rewarded.isReady() && !isShowing;
  }, [isShowing, cooldownTick]);

  return {
    showRewardedAd,
    isShowing,
    isReady,
    getCooldown,
  };
};
