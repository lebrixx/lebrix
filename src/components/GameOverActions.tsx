import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { RewardButton } from '@/ads/RewardIntegration';

interface GameOverActionsProps {
  onMenu: () => void;
  onReplay: () => void;
  onRevive?: () => void;
}

/**
 * Boutons d'action affichés en écran Game Over pour tous les modes 3D.
 * - "Revivre avec pub" (pleine largeur, en haut) : appelle onRevive après
 *   visionnage d'une rewarded ad.
 * - "Menu" / "Rejouer" en dessous, bien espacés.
 */
export const GameOverActions: React.FC<GameOverActionsProps> = ({ onMenu, onReplay, onRevive }) => {
  return (
    <div className="flex flex-col gap-4 items-stretch w-full max-w-xs mx-auto">
      {onRevive && (
        <RewardButton
          kind="revive"
          onReward={() => onRevive()}
          label="Revivre avec pub"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-amber-500/30 h-11"
        />
      )}
      <div className="flex gap-4 justify-center">
        <Button onClick={onMenu} variant="outline" className="border-wheel-border flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> Menu
        </Button>
        <Button onClick={onReplay} className="bg-gradient-primary flex-1">
          <RotateCcw className="w-4 h-4 mr-2" /> Rejouer
        </Button>
      </div>
    </div>
  );
};
