import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
import { RewardButton } from '@/ads/RewardIntegration';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface GameOverActionsProps {
  onMenu: () => void;
  onReplay: () => void;
  onOpenBoosts?: () => void;
  onRevive?: () => void;
}

export const GameOverActions: React.FC<GameOverActionsProps> = ({
  onMenu,
  onReplay,
  onOpenBoosts,
  onRevive,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  return (
    <>
      <Button
        onClick={onMenu}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 z-10 border-wheel-border"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> {t.menu}
      </Button>

      <div className="flex flex-col gap-3 items-stretch w-full max-w-xs mx-auto">
        {onOpenBoosts && (
          <Button
            onClick={onOpenBoosts}
            className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-fuchsia-500/30"
          >
            <Zap className="w-4 h-4 mr-2" /> {t.activateBoosts}
          </Button>
        )}
        <Button onClick={onReplay} className="bg-gradient-primary">
          <RotateCcw className="w-4 h-4 mr-2" /> {t.replay}
        </Button>
      </div>

      {onRevive && (
        <div className="absolute bottom-28 left-4 z-10">
          <RewardButton
            kind="revive"
            onReward={() => onRevive()}
            label={t.reviveWithAd}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-amber-500/30 h-11"
          />
        </div>
      )}
    </>
  );
};
