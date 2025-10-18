import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useToast } from '@/hooks/use-toast';
import { RewardKind } from '@/ads/RewardedService';
import { BoostType } from '@/types/boosts';

interface RewardButtonProps {
  kind: RewardKind;
  onReward: (kind: RewardKind) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const RewardButton: React.FC<RewardButtonProps> = ({ 
  kind, 
  onReward, 
  label, 
  disabled = false,
  className = ''
}) => {
  const { showRewardedAd, isShowing, isReady, getCooldown } = useRewardedAd();
  const { toast } = useToast();
  const cooldown = getCooldown();

  const handleClick = async () => {
    const success = await showRewardedAd(kind);
    
    if (success) {
      // Mapper le kind vers la récompense appropriée
      switch (kind) {
        case 'revive':
          toast({
            title: "Revive activé !",
            description: "Tu as été ramené à la vie !",
          });
          break;
        case 'boost1':
          toast({
            title: "Boost reçu !",
            description: "Tu as reçu un Bouclier 🛡️",
          });
          break;
        case 'boost2':
          toast({
            title: "Boost reçu !",
            description: "Tu as reçu une Zone plus grande 🎯",
          });
          break;
        case 'boost3':
          toast({
            title: "Boost reçu !",
            description: "Tu as reçu un Démarrage à 20 🚀",
          });
          break;
        case 'coins80':
          toast({
            title: "Coins reçus !",
            description: "Tu as reçu 100 coins ! 🪙",
          });
          break;
        case 'ticket':
          toast({
            title: "Tickets reçus !",
            description: "Tu as reçu 5 tickets pour le mode Expert ! 🎫",
          });
          break;
      }
      
      onReward(kind);
    }
  };

  const isButtonDisabled = disabled || !isReady() || cooldown > 0 || isShowing;

  return (
    <Button
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isShowing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Pub en cours...
        </>
      ) : cooldown > 0 ? (
        <>Disponible dans {cooldown}s</>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
};

// Helpers pour convertir les RewardKind en récompenses concrètes
export const getBoostFromKind = (kind: RewardKind): BoostType | null => {
  switch (kind) {
    case 'boost1': return 'shield';
    case 'boost2': return 'bigger_zone';
    case 'boost3': return 'start_20';
    default: return null;
  }
};

export const getCoinsFromKind = (kind: RewardKind): number => {
  return kind === 'coins80' ? 100 : 0;
};

export const getTicketsFromKind = (kind: RewardKind): number => {
  return kind === 'ticket' ? 5 : 0;
};
