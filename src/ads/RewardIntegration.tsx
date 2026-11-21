import React from 'react';
import { trs } from '@/i18n/tr';
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
            title: trs("Revive activé !", "Revive activated!", "¡Revivir activado!"),
            description: trs("Tu as été ramené à la vie !", "You are back in the game!", "¡Has vuelto a la vida!"),
          });
          break;
        case 'boost1':
          toast({
            title: trs("Boost reçu !", "Boost received!", "¡Boost recibido!"),
            description: trs("Tu as reçu un Bouclier 🛡️", "You got a Shield 🛡️", "Has recibido un Escudo 🛡️"),
          });
          break;
        case 'boost2':
          toast({
            title: trs("Boost reçu !", "Boost received!", "¡Boost recibido!"),
            description: trs("Tu as reçu un Convertisseur de score 💰", "You got a Score converter 💰", "Has recibido un Convertidor de puntuación 💰"),
          });
          break;
        case 'boost3':
          toast({
            title: trs("Boost reçu !", "Boost received!", "¡Boost recibido!"),
            description: trs("Tu as reçu un Démarrage à 20 🚀", "You got a Start at 20 🚀", "Has recibido un Empezar en 20 🚀"),
          });
          break;
        case 'coins80':
          toast({
            title: trs("Pièces reçues !", "Coins received!", "¡Monedas recibidas!"),
            description: trs("Tu as reçu 100 pièces ! 🪙", "You got 100 coins! 🪙", "¡Has recibido 100 monedas! 🪙"),
          });
          break;
        case 'ticket':
          toast({
            title: trs("Tickets reçus !", "Tickets received!", "¡Tickets recibidos!"),
            description: trs("Tu as reçu 5 tickets ! 🎫", "You got 5 tickets! 🎫", "¡Has recibido 5 tickets! 🎫"),
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
          {trs("Pub en cours...", "Ad playing...", "Anuncio en curso...")}
        </>
      ) : cooldown > 0 ? (
        <>{trs("Disponible dans", "Available in", "Disponible en")} {cooldown}s</>
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
