import { ReactNode } from 'react';
import { ArrowLeft, Coins, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface GameHUDProps {
  score: number;
  coins: number;
  onBack?: () => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  status?: ReactNode;
}

export function GameHUD({ score, coins, onBack, isSoundMuted, onToggleSound, status }: GameHUDProps) {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="relative z-20 grid min-h-24 shrink-0 grid-cols-3 items-start gap-2 px-4 pt-4 pb-3" data-game-hud>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <Button variant="outline" size="sm" onClick={onBack} className="border-wheel-border">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t.menu}
        </Button>
        {status}
      </div>
      <div className="min-w-0 text-center pointer-events-none">
        <div className="text-xs text-text-muted uppercase">{t.score}</div>
        <div className="text-4xl font-bold leading-tight text-primary tabular-nums" data-game-score>{score}</div>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-2">
        {onToggleSound && (
          <Button variant="outline" size="sm" onClick={onToggleSound} aria-label={t.sound} aria-pressed={!isSoundMuted} className="border-wheel-border">
            {isSoundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        )}
        <div className="flex max-w-full items-center gap-1 rounded-full border border-secondary/40 bg-secondary/15 px-2 py-1" data-game-coins>
          <Coins className="h-4 w-4 shrink-0 text-secondary" />
          <span className="min-w-0 truncate text-sm font-bold text-secondary tabular-nums">{coins}</span>
        </div>
      </div>
    </div>
  );
}