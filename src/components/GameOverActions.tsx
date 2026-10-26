import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, RotateCcw, Zap, Share2, Crown } from 'lucide-react';
import { RewardButton } from '@/ads/RewardIntegration';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface GameOverActionsProps {
  onMenu: () => void;
  onReplay: () => void;
  onOpenBoosts?: () => void;
  onRevive?: () => void;
  score?: number;
  best?: number;
  bestSuffix?: string;
  mode?: string;
}

const MODE_NAMES: Record<string, string> = {
  classic: 'Cube Dodge',
  arc_changeant: 'Ball Balance',
  survie_60s: 'Stack Jump',
  zone_mobile: 'Falling Tunnel',
  zone_traitresse: 'Orbit Dodge',
  memoire_expert: 'Rotating Cube',
};

const COPY = {
  fr: { lost: 'Perdu', record: 'Record', newRecord: 'Nouveau record !', boostSub: 'Pour ta prochaine partie', reviveSub: 'Continue ta partie' },
  en: { lost: 'Game Over', record: 'Best', newRecord: 'New record!', boostSub: 'For your next game', reviveSub: 'Keep playing' },
  es: { lost: 'Perdiste', record: 'Récord', newRecord: '¡Nuevo récord!', boostSub: 'Para tu próxima partida', reviveSub: 'Continúa tu partida' },
} as const;

export const GameOverActions: React.FC<GameOverActionsProps> = ({
  onMenu, onReplay, onOpenBoosts, onRevive, score, best, bestSuffix = '', mode,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const c = COPY[(language as keyof typeof COPY)] || COPY.en;
  const { toast } = useToast();
  const isNewRecord = score !== undefined && best !== undefined && score > 0 && score >= best;

  const handleShare = async () => {
    if (score === undefined) return;
    const modeName = (mode && MODE_NAMES[mode]) || 'Lucky Stop';
    const text = (t.shareScoreText || 'I scored {score} on {mode} in Lucky Stop! Can you beat me?')
      .replace('{score}', String(score))
      .replace('{mode}', modeName);
    const url = 'https://lebrix.lovable.app';
    try {
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ title: 'Lucky Stop', text, url, dialogTitle: text });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: 'Lucky Stop', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: t.shareCopied || 'Copié !', description: t.shareCopiedDesc || 'Résultat copié dans le presse-papier.' });
    } catch (error: any) {
      if (error?.name === 'AbortError' || /cancel/i.test(error?.message || '')) return;
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: t.shareCopied || 'Copié !', description: t.shareCopiedDesc || 'Résultat copié dans le presse-papier.' });
      } catch { /* ignore */ }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-40 overflow-hidden overscroll-none touch-none bg-game-darker/85 backdrop-blur-md">
      {/* Halo néon de fond */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,hsl(var(--secondary)/0.25),transparent_60%)]" />

      <div
        className="relative flex h-full flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] [&_*]:touch-manipulation"
        style={{ paddingTop: 'var(--app-top-clearance, 64px)' }}
      >
        {/* Barre du haut */}
        <div className="flex items-center justify-between">
          <button
            onClick={onMenu}
            className="flex items-center gap-2 rounded-full border border-secondary/50 bg-game-dark/60 px-4 py-2 text-sm font-semibold text-text-primary shadow-[0_0_12px_hsl(var(--secondary)/0.35)] active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" /> {t.menu}
          </button>
          {score !== undefined && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-secondary/50 bg-game-dark/60 px-4 py-2 text-sm font-semibold text-text-primary shadow-[0_0_12px_hsl(var(--secondary)/0.35)] active:scale-95 transition-transform"
            >
              <Share2 className="h-4 w-4" /> {t.shareScore || 'Partager'}
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-2">
          {/* Titre */}
          <div className="relative mb-3 text-center">
            <Crown className="mx-auto mb-1 h-10 w-10 -rotate-6 text-secondary drop-shadow-[0_0_14px_hsl(var(--secondary)/0.8)]" strokeWidth={2.2} />
            <h2
              className="text-5xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-text-primary to-secondary"
              style={{ filter: 'drop-shadow(0 4px 0 hsl(var(--secondary) / 0.55)) drop-shadow(0 0 18px hsl(var(--secondary) / 0.6))' }}
            >
              {c.lost}&nbsp;!
            </h2>
          </div>

          {/* Carte score */}
          <div className="mb-4 w-full max-w-[19rem] rounded-3xl border border-secondary/60 bg-game-dark/70 px-6 py-4 text-center shadow-[0_0_24px_hsl(var(--secondary)/0.3)]">
            <div className="text-base text-text-secondary">Score</div>
            <div className="text-5xl font-black leading-tight tabular-nums text-primary drop-shadow-[0_0_14px_hsl(var(--primary)/0.7)]">
              {score ?? 0}
            </div>
            {best !== undefined && (
              <div className="mt-2 flex items-center justify-center gap-2 border-t border-text-primary/10 pt-2 text-base">
                <Crown className="h-4 w-4 text-secondary" />
                {isNewRecord ? (
                  <span className="font-bold text-secondary">{c.newRecord}</span>
                ) : (
                  <span className="text-text-secondary">
                    {c.record} : <span className="font-bold text-secondary">{best}{bestSuffix}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full max-w-xs flex-col gap-3">
            {onOpenBoosts && (
              <button
                onClick={onOpenBoosts}
                className="flex items-center gap-4 rounded-2xl border border-text-primary/30 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-left text-white shadow-[0_0_20px_rgba(217,70,239,0.45)] active:scale-[0.98] transition-transform"
              >
                <Zap className="h-7 w-7 shrink-0" />
                <span className="flex-1 text-center">
                  <span className="block text-lg font-bold leading-tight">{t.activateBoosts}</span>
                  <span className="block text-lg font-bold leading-tight">{c.boostSub}</span>
                </span>
              </button>
            )}
            <button
              onClick={onReplay}
              className="flex items-center justify-center gap-3 rounded-2xl border border-secondary/50 bg-game-dark/80 px-5 py-3 text-lg font-bold text-text-primary active:scale-[0.98] transition-transform"
            >
              <RotateCcw className="h-6 w-6" /> {t.replay}
            </button>
            {onRevive && (
              <div className="flex flex-col">
                <RewardButton
                  kind="revive"
                  onReward={() => onRevive()}
                  label={t.reviveWithAd}
                  className="h-14 w-full rounded-2xl border border-yellow-300/60 bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white shadow-[0_0_20px_rgba(245,158,11,0.45)] hover:from-amber-400 hover:to-orange-400"
                />
                <span className="mt-1 text-center text-xs text-amber-300/80">{c.reviveSub}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
