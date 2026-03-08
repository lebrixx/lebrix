import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Clock, Trophy, Crosshair } from 'lucide-react';
import {
  getDailyTarget,
  hasPlayedToday,
  recordDailyResult,
  getTodayResult,
  getDailyBestGap,
  updateDailyBest,
  getSecondsUntilNextChallenge,
  formatCountdown,
} from '@/utils/dailyChallenge';

interface DailyChallengeProps {
  onBack: () => void;
}

type Phase = 'intro' | 'running' | 'result';

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBack }) => {
  const target = getDailyTarget();
  const alreadyPlayed = hasPlayedToday();
  const existingResult = getTodayResult();
  const bestGap = getDailyBestGap();

  const [phase, setPhase] = useState<Phase>(alreadyPlayed ? 'result' : 'intro');
  const [timerValue, setTimerValue] = useState(0);
  const [result, setResult] = useState(existingResult);
  const [countdown, setCountdown] = useState(getSecondsUntilNextChallenge());

  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Countdown for next challenge
  useEffect(() => {
    if (phase !== 'result') return;
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilNextChallenge());
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Timer animation — speed: ~2.5 units per second (fast enough to be challenging)
  const SPEED = 2.5;
  const MAX_VALUE = 15;

  const startTimer = useCallback(() => {
    setPhase('running');
    setTimerValue(0);
    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const val = (elapsed * SPEED) % MAX_VALUE;
      setTimerValue(val);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const stopped = Math.round(timerValue * 1000) / 1000;
    const { gap, target: t } = recordDailyResult(stopped);
    updateDailyBest(gap);
    setResult({ result: stopped, gap, target: t });
    setPhase('result');
  }, [timerValue]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Gap quality label
  const getQualityLabel = (gap: number): { label: string; color: string } => {
    if (gap <= 0.005) return { label: 'PARFAIT !', color: 'text-[hsl(var(--success))]' };
    if (gap <= 0.05) return { label: 'INCROYABLE', color: 'text-[hsl(var(--success))]' };
    if (gap <= 0.1) return { label: 'EXCELLENT', color: 'text-[hsl(var(--primary))]' };
    if (gap <= 0.3) return { label: 'TRÈS BIEN', color: 'text-[hsl(var(--primary))]' };
    if (gap <= 0.5) return { label: 'BIEN', color: 'text-[hsl(var(--secondary))]' };
    if (gap <= 1.0) return { label: 'PAS MAL', color: 'text-[hsl(var(--text-secondary))]' };
    return { label: 'À REESSAYER', color: 'text-[hsl(var(--danger))]' };
  };

  // ────── INTRO SCREEN ──────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 relative">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="absolute top-14 left-4 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))]"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="text-center space-y-6 max-w-sm">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--secondary)/0.2)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center">
            <Crosshair className="w-10 h-10 text-[hsl(var(--primary))]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))] mb-2">
              Défi Précision
            </h1>
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Une seule tentative par jour. Chaque milliseconde compte.
            </p>
          </div>

          {/* Target display */}
          <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl p-6">
            <p className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-widest mb-2">
              Cible du jour
            </p>
            <p className="text-5xl font-mono font-black bg-gradient-primary bg-clip-text text-transparent">
              {target.toFixed(3)}
            </p>
          </div>

          <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">
            Le chrono défile. Appuie au bon moment pour t'arrêter le plus proche possible de la cible.
          </p>

          {bestGap !== null && (
            <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--text-secondary))]">
              <Trophy className="w-4 h-4 text-[hsl(var(--secondary))]" />
              <span>Meilleur écart : <strong className="text-[hsl(var(--secondary))]">{bestGap.toFixed(3)}</strong></span>
            </div>
          )}

          <Button
            onClick={startTimer}
            className="w-full py-6 text-lg font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_24px_hsl(var(--primary)/0.4)] transition-all duration-300 rounded-2xl"
          >
            <Target className="w-5 h-5 mr-2" />
            Lancer le défi
          </Button>
        </div>
      </div>
    );
  }

  // ────── RUNNING SCREEN ──────
  if (phase === 'running') {
    return (
      <div
        className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 select-none cursor-pointer active:bg-[hsl(var(--game-darker))]"
        onPointerDown={stopTimer}
      >
        {/* Target reminder */}
        <div className="absolute top-20 flex items-center gap-2 text-[hsl(var(--text-muted))]">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-sm">Cible : <strong className="text-[hsl(var(--primary))]">{target.toFixed(3)}</strong></span>
        </div>

        {/* Big Timer */}
        <p className="text-7xl sm:text-8xl font-mono font-black text-[hsl(var(--text-primary))] tabular-nums tracking-tight">
          {timerValue.toFixed(3)}
        </p>

        <p className="mt-8 text-sm text-[hsl(var(--text-muted))] animate-pulse">
          Appuie n'importe où pour stopper
        </p>
      </div>
    );
  }

  // ────── RESULT SCREEN ──────
  const quality = result ? getQualityLabel(result.gap) : { label: '', color: '' };
  const updatedBest = getDailyBestGap();

  return (
    <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm w-full">
        {/* Quality */}
        {result && (
          <>
            <p className={`text-3xl font-black tracking-wide ${quality.color}`}>
              {quality.label}
            </p>

            {/* Result details */}
            <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--text-muted))]">Cible</span>
                <span className="text-lg font-mono font-bold text-[hsl(var(--primary))]">{result.target.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--text-muted))]">Ton arrêt</span>
                <span className="text-lg font-mono font-bold text-[hsl(var(--text-primary))]">{result.result.toFixed(3)}</span>
              </div>
              <div className="h-px bg-[hsl(var(--wheel-border)/0.4)]" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[hsl(var(--text-secondary))]">Écart</span>
                <span className={`text-2xl font-mono font-black ${quality.color}`}>
                  {result.gap.toFixed(3)}
                </span>
              </div>
            </div>

            {updatedBest !== null && (
              <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--text-secondary))]">
                <Trophy className="w-4 h-4 text-[hsl(var(--secondary))]" />
                <span>Record : <strong className="text-[hsl(var(--secondary))]">{updatedBest.toFixed(3)}</strong></span>
              </div>
            )}
          </>
        )}

        {/* Next challenge countdown */}
        <div className="bg-[hsl(var(--wheel-base)/0.5)] border border-[hsl(var(--wheel-border)/0.3)] rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 text-[hsl(var(--text-muted))]">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Prochain défi dans</span>
          </div>
          <p className="text-2xl font-mono font-bold text-[hsl(var(--text-primary))] mt-1">
            {formatCountdown(countdown)}
          </p>
        </div>

        <Button
          onClick={onBack}
          variant="outline"
          className="w-full py-4 border-[hsl(var(--wheel-border))] hover:bg-[hsl(var(--button-hover))] rounded-xl text-[hsl(var(--text-primary))]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au menu
        </Button>
      </div>
    </div>
  );
};
