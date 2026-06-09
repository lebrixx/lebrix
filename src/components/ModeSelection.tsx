import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, RotateCcw, Target, AlertTriangle, Lock, ShoppingBag, Brain, Zap, Star, Trophy, Gamepad2, Sparkles, Box, Layers } from 'lucide-react';
import { cfgModes, ModeType, ModeID } from '@/constants/modes';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { SlotMachine } from '@/components/SlotMachine';
import { isBonusActive, canSpinSlotToday, getActiveBonusMode } from '@/utils/dailyBonusMode';
import { getPongUnlockCount, PONG_UNLOCK_TARGET } from '@/utils/pongUnlock';

interface ModeSelectionProps {
  currentMode: ModeType;
  gameStatus: 'idle' | 'running' | 'gameover';
  bestScores: Record<string, number>;
  unlockedModes: string[];
  onSelectMode: (mode: ModeType, selectedBoosts?: string[]) => void;
  onBack: () => void;
  onOpenShop: () => void;
  onOpenChallenges?: () => void;
  
}

const getModeIcon = (modeId: ModeType) => {
  switch (modeId) {
    case ModeID.CLASSIC:
      return <Target className="w-8 h-8" />;
    case ModeID.ARC_CHANGEANT:
      return <Box className="w-8 h-8" />;
    case ModeID.SURVIE_60S:
      return <Layers className="w-8 h-8" />;
    case ModeID.ZONE_MOBILE:
      return <RotateCcw className="w-8 h-8" style={{ transform: 'rotate(90deg)' }} />;
    case ModeID.ZONE_TRAITRESSE:
      return <Sparkles className="w-8 h-8" />;
    case ModeID.MEMOIRE_EXPERT:
      return <Brain className="w-8 h-8" />;
    case ModeID.PONG_CIRCULAIRE:
      return <Gamepad2 className="w-8 h-8" />;
    default:
      return <Target className="w-8 h-8" />;
  }
};

// Palette d'accents par mode (couleurs Tailwind sûres)
const MODE_ACCENT: Record<string, { from: string; to: string; ring: string; iconBg: string; chip: string }> = {
  [ModeID.CLASSIC]:          { from: 'from-cyan-500/20',    to: 'to-fuchsia-500/10',  ring: 'shadow-[0_0_40px_-10px_rgba(34,211,238,0.55)]', iconBg: 'from-cyan-500 to-fuchsia-500',    chip: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10' },
  [ModeID.ARC_CHANGEANT]:    { from: 'from-purple-500/20',  to: 'to-pink-500/10',     ring: 'shadow-[0_0_40px_-10px_rgba(168,85,247,0.55)]',  iconBg: 'from-purple-500 to-pink-500',     chip: 'border-purple-400/40 text-purple-300 bg-purple-400/10' },
  [ModeID.SURVIE_60S]:       { from: 'from-fuchsia-500/20', to: 'to-amber-500/10',    ring: 'shadow-[0_0_40px_-10px_rgba(232,121,249,0.55)]', iconBg: 'from-fuchsia-500 to-amber-500',   chip: 'border-fuchsia-400/40 text-fuchsia-300 bg-fuchsia-400/10' },
  [ModeID.ZONE_MOBILE]:      { from: 'from-emerald-500/20', to: 'to-cyan-500/10',     ring: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.55)]',  iconBg: 'from-emerald-500 to-cyan-500',    chip: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10' },
  [ModeID.ZONE_TRAITRESSE]:  { from: 'from-fuchsia-500/20', to: 'to-amber-400/10',    ring: 'shadow-[0_0_40px_-10px_rgba(168,85,247,0.55)]',  iconBg: 'from-fuchsia-500 via-purple-500 to-amber-400', chip: 'border-amber-300/40 text-amber-200 bg-amber-300/10' },
  [ModeID.MEMOIRE_EXPERT]:   { from: 'from-cyan-500/20',    to: 'to-indigo-500/10',   ring: 'shadow-[0_0_40px_-10px_rgba(99,102,241,0.55)]',  iconBg: 'from-cyan-500 to-indigo-500',     chip: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10' },
  [ModeID.PONG_CIRCULAIRE]:  { from: 'from-pink-500/20',    to: 'to-purple-500/10',   ring: 'shadow-[0_0_40px_-10px_rgba(236,72,153,0.55)]',  iconBg: 'from-pink-500 to-purple-500',     chip: 'border-pink-400/40 text-pink-300 bg-pink-400/10' },
};

const DEFAULT_ACCENT = MODE_ACCENT[ModeID.CLASSIC];

export const ModeSelection: React.FC<ModeSelectionProps> = ({
  currentMode,
  gameStatus,
  bestScores,
  unlockedModes,
  onSelectMode,
  onBack,
  onOpenShop,
  onOpenChallenges,
  
}) => {
  const isGameRunning = gameStatus === 'running';
  const { language } = useLanguage();
  const t = translations[language];
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [bonusMode, setBonusMode] = useState<ModeType | null>(getActiveBonusMode());
  const canSpin = canSpinSlotToday();
  const [countdown, setCountdown] = useState('');

  // Countdown to midnight
  useEffect(() => {
    if (canSpin || !bonusMode) return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 1, 0, 0); // 00h01 next day
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) { setCountdown(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [canSpin, bonusMode]);

  const handleBonusActivated = (mode: ModeType) => {
    setBonusMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col items-center p-4 pt-10 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-40 -right-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="w-full max-w-4xl mb-6 relative">
        <Button
          onClick={onBack}
          variant="outline"
          className="mb-6 border-wheel-border hover:bg-button-hover"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au Menu
        </Button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Choisis ton défi</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent mb-3 drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
            {t.modeSelectionTitle}
          </h1>

          {/* Slot Machine Button */}
          <Button
            onClick={() => setShowSlotMachine(true)}
            variant="outline"
            className={`mt-3 transition-all duration-300 border ${
              canSpin
                ? 'border-primary/50 text-primary hover:bg-primary/10 hover:scale-[1.03] animate-[pulse-glow_3s_ease-in-out_infinite]'
                : bonusMode
                  ? 'border-secondary/40 text-secondary hover:bg-secondary/10'
                  : 'border-wheel-border text-text-muted'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            {canSpin
              ? 'Bonus x2 disponible'
              : bonusMode
                ? `${cfgModes[bonusMode].name} — x2 actif`
                : 'Bonus x2'
            }
          </Button>
          {!canSpin && bonusMode && countdown && (
            <p className="text-text-muted text-xs mt-2 flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3" />
              Prochain tirage dans {countdown}
            </p>
          )}
        </div>
      </div>


      {/* Slot Machine Dialog */}
      <SlotMachine
        isOpen={showSlotMachine}
        onClose={() => setShowSlotMachine(false)}
        unlockedModes={unlockedModes}
        onBonusActivated={handleBonusActivated}
      />

      {/* Warning if game is running */}
      {isGameRunning && (
        <div className="w-full max-w-4xl mb-6">
          <Card className="bg-danger/10 border-danger p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-danger flex-shrink-0" />
              <div>
                <p className="text-danger font-medium">{t.modeGameInProgressLabel}</p>
                <p className="text-text-muted text-sm">{t.modeGameInProgressDescLabel}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl relative">
        {Object.entries(cfgModes).map(([modeId, config]) => {
          const isCurrentMode = modeId === currentMode;
          const isLocked = !unlockedModes.includes(modeId);
          const canSelect = !isGameRunning && !isLocked;
          const hasBonus = isBonusActive(modeId as ModeType);
          const isPongChallenge = modeId === ModeID.PONG_CIRCULAIRE && isLocked;
          const pongUnlock = isPongChallenge ? getPongUnlockCount() : null;
          const accent = MODE_ACCENT[modeId] ?? DEFAULT_ACCENT;

          return (
            <Card
              key={modeId}
              className={`
                group relative overflow-hidden border transition-all duration-300 rounded-2xl
                bg-gradient-to-br ${accent.from} ${accent.to}
                ${isCurrentMode
                  ? `border-primary/70 ${accent.ring}`
                  : isLocked
                    ? 'border-white/5 opacity-90'
                    : 'border-white/10 hover:border-white/30'
                }
                ${!isLocked && !isGameRunning ? 'hover:-translate-y-1 hover:shadow-2xl' : ''}
              `}
            >
              {/* glossy top edge */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {/* radial glow on hover */}
              <div className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.08), transparent 40%)' }} />

              {/* Bonus x2 Star Badge */}
              {hasBonus && !isLocked && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-secondary/90 text-white border-secondary animate-pulse">
                    <Star className="w-3 h-3 mr-1" />
                    x2 COINS
                  </Badge>
                </div>
              )}
              {/* Locked Badge */}
              {isLocked && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className={isPongChallenge ? 'bg-secondary/90 text-white border-secondary' : 'bg-danger/90 text-white border-danger'}>
                    <Lock className="w-3 h-3 mr-1" />
                    {isPongChallenge ? t.challengeRequired : t.locked}
                  </Badge>
                </div>
              )}
              <div className="p-5 relative">
                {/* Mode Icon & Name */}
                <div className="flex items-center gap-4 mb-3">
                  <div className={`
                    relative p-3 rounded-2xl text-white shadow-lg
                    bg-gradient-to-br ${accent.iconBg}
                    ${isCurrentMode ? 'ring-2 ring-white/30' : ''}
                  `}>
                    {getModeIcon(modeId as ModeType)}
                    <div className="absolute inset-0 rounded-2xl bg-white/10 mix-blend-overlay" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-text-primary leading-tight">
                      {config.name}
                    </h3>
                    {isCurrentMode && (
                      <Badge variant="secondary" className="mt-1">
                        {t.equipped}
                      </Badge>
                    )}
                  </div>
                </div>


                {/* Description */}
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {config.desc}
                </p>

                {/* Mode Features */}
                <div className="space-y-2 mb-6">
                  {config.survival && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>{t.durationLabel}: {config.survivalTime}s</span>
                    </div>
                  )}
                  {config.variableArc && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <RotateCcw className="w-4 h-4" />
                      <span>Arc variable</span>
                    </div>
                  )}
                  {config.keepMovingZone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Target className="w-4 h-4" />
                      <span>Zone mobile</span>
                    </div>
                  )}
                </div>

                {/* Best Score */}
                <div className="mb-4 p-3 bg-wheel-segment/20 rounded-lg border border-wheel-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Meilleur Score:</span>
                    <Badge variant="outline" className="border-primary text-primary">
                      {bestScores[modeId] || 0}
                    </Badge>
                  </div>
                </div>

                {/* Select Button */}
                {isLocked ? (
                  isPongChallenge ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30 text-xs text-text-secondary">
                        <div className="flex items-center gap-2 mb-1 text-secondary font-semibold">
                          <Trophy className="w-3.5 h-3.5" />
                          {t.unlockChallenge}
                        </div>
                        <p>Atteins un score de {PONG_UNLOCK_TARGET}+ dans chacun des autres modes.</p>
                        {pongUnlock && (
                          <p className="mt-1 font-bold text-secondary">Progression : {pongUnlock.done}/{pongUnlock.total}</p>
                        )}
                      </div>
                      <Button
                        onClick={onOpenChallenges}
                        className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white shadow-lg shadow-secondary/20"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        {t.viewChallenge}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={onOpenShop}
                      className="w-full bg-danger hover:bg-danger/90 transition-all"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Acheter en Boutique
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => onSelectMode(modeId as ModeType)}
                    disabled={!canSelect}
                    className={`
                      w-full transition-all duration-300
                      ${isCurrentMode 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-gradient-primary hover:scale-105'
                      }
                    `}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {isCurrentMode ? t.playNowMode : t.selectMode}
                  </Button>
                )}
              </div>

              {/* Current Mode Indicator */}
              {isCurrentMode && (
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                </div>
              )}
            </Card>
          );
        })}
      </div>


      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-sm">
          {t.separateScoresInfo}
        </p>
      </div>
    </div>
  );
};
