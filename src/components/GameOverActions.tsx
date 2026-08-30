import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Zap, Share2 } from 'lucide-react';
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

export const GameOverActions: React.FC<GameOverActionsProps> = ({
  onMenu,
  onReplay,
  onOpenBoosts,
  onRevive,
  score,
  mode,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();

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
      // Fallback : copie dans le presse-papier
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: t.shareCopied || 'Copié !', description: t.shareCopiedDesc || 'Résultat copié dans le presse-papier.' });
    } catch (error: any) {
      // Annulation utilisateur : pas d'erreur affichée
      if (error?.name === 'AbortError' || /cancel/i.test(error?.message || '')) return;
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast({ title: t.shareCopied || 'Copié !', description: t.shareCopiedDesc || 'Résultat copié dans le presse-papier.' });
      } catch {
        // ignore
      }
    }
  };

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
        {score !== undefined && (
          <Button
            onClick={handleShare}
            variant="outline"
            className="border-wheel-border hover:bg-button-hover text-text-primary"
          >
            <Share2 className="w-4 h-4 mr-2" /> {t.shareScore || 'Partager'}
          </Button>
        )}
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
