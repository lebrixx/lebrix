import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
import { RewardButton } from '@/ads/RewardIntegration';

interface GameOverActionsProps {
  onMenu: () => void;
  onReplay: () => void;
  onOpenBoosts?: () => void;
  onRevive?: () => void;
}

/**
 * Layout des actions de Game Over pour les modes 3D.
 * Doit être rendu à l'intérieur d'un overlay `absolute inset-0` (ou tout autre
 * conteneur `relative/absolute`) car les boutons Menu et Revivre sont
 * positionnés en absolu par rapport à cet overlay.
 *
 * - Menu : en haut à gauche
 * - Activer Boosts + Rejouer : empilés au centre (Rejouer sous Activer Boosts)
 * - Revivre avec pub : en bas à gauche
 */
export const GameOverActions: React.FC<GameOverActionsProps> = ({
  onMenu,
  onReplay,
  onOpenBoosts,
  onRevive,
}) => {
  return (
    <>
      {/* Menu — top left */}
      <Button
        onClick={onMenu}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 z-10 border-wheel-border"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Menu
      </Button>

      {/* Centered stack: Activer Boosts puis Rejouer */}
      <div className="flex flex-col gap-3 items-stretch w-full max-w-xs mx-auto">
        {onOpenBoosts && (
          <Button
            onClick={onOpenBoosts}
            className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-fuchsia-500/30"
          >
            <Zap className="w-4 h-4 mr-2" /> Activer des Boosts
          </Button>
        )}
        <Button onClick={onReplay} className="bg-gradient-primary">
          <RotateCcw className="w-4 h-4 mr-2" /> Rejouer
        </Button>
      </div>

      {/* Revive — bottom left, un peu plus bas */}
      {onRevive && (
        <div className="absolute bottom-6 left-4 z-10">
          <RewardButton
            kind="revive"
            onReward={() => onRevive()}
            label="Revivre avec pub"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-amber-500/30 h-11"
          />
        </div>
      )}
    </>
  );
};
