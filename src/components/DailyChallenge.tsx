import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Clock, Trophy, Crosshair, Crown, Medal, Users } from 'lucide-react';
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
import { submitPrecisionScore, fetchDailyPrecisionLeaderboard, type PrecisionEntry } from '@/utils/precisionApi';
import { getUsername } from '@/utils/localIdentity';

interface DailyChallengeProps {
  onBack: () => void;
}

type Phase = 'intro' | 'running' | 'result';

// Gap quality label
const getQualityLabel = (gap: number): { label: string; color: string; emoji: string } => {
  if (gap <= 0.005) return { label: 'PARFAIT !', color: 'text-[hsl(var(--success))]', emoji: '🎯' };
  if (gap <= 0.05) return { label: 'INCROYABLE', color: 'text-[hsl(var(--success))]', emoji: '🔥' };
  if (gap <= 0.1) return { label: 'EXCELLENT', color: 'text-[hsl(var(--primary))]', emoji: '⚡' };
  if (gap <= 0.3) return { label: 'TRÈS BIEN', color: 'text-[hsl(var(--primary))]', emoji: '✨' };
  if (gap <= 0.5) return { label: 'BIEN', color: 'text-[hsl(var(--secondary))]', emoji: '👍' };
  if (gap <= 1.0) return { label: 'PAS MAL', color: 'text-[hsl(var(--text-secondary))]', emoji: '👌' };
  return { label: 'À RÉESSAYER', color: 'text-[hsl(var(--danger))]', emoji: '💪' };
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-[hsl(var(--text-muted))] font-mono w-4 text-center">{rank}</span>;
};

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBack }) => {
  const target = getDailyTarget();
  const alreadyPlayed = hasPlayedToday();
  const existingResult = getTodayResult();
  const bestGap = getDailyBestGap();
  const currentUsername = getUsername();

  const [phase, setPhase] = useState<Phase>(alreadyPlayed ? 'result' : 'intro');
  const [timerValue, setTimerValue] = useState(0);
  const [result, setResult] = useState(existingResult);
  const [countdown, setCountdown] = useState(getSecondsUntilNextChallenge());
  const [leaderboard, setLeaderboard] = useState<PrecisionEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Fetch leaderboard
  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    const data = await fetchDailyPrecisionLeaderboard();
    setLeaderboard(data);
    setLoadingLb(false);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Countdown
  useEffect(() => {
    if (phase !== 'result') return;
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilNextChallenge());
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Timer
  const SPEED = 2.5;
  const MAX_VALUE = 15;

  const startTimer = useCallback(() => {
    setPhase('running');
    setTimerValue(0);
    startTimeRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setTimerValue((elapsed * SPEED) % MAX_VALUE);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = useCallback(async () => {
    cancelAnimationFrame(animRef.current);
    const stopped = Math.round(timerValue * 1000) / 1000;
    const { gap, target: t } = recordDailyResult(stopped);
    updateDailyBest(gap);
    setResult({ result: stopped, gap, target: t });
    setPhase('result');

    // Submit to leaderboard
    await submitPrecisionScore(t, stopped, gap);
    loadLeaderboard();
  }, [timerValue, loadLeaderboard]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ────── RUNNING SCREEN ──────
  if (phase === 'running') {
    return (
      <div
        className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 select-none cursor-pointer active:bg-[hsl(var(--game-darker))]"
        onPointerDown={stopTimer}
      >
        <div className="absolute top-20 flex items-center gap-2 text-[hsl(var(--text-muted))]">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-sm">Cible : <strong className="text-[hsl(var(--primary))]">{target.toFixed(3)}</strong></span>
        </div>
        <p className="text-7xl sm:text-8xl font-mono font-black text-[hsl(var(--text-primary))] tabular-nums tracking-tight">
          {timerValue.toFixed(3)}
        </p>
        <p className="mt-8 text-sm text-[hsl(var(--text-muted))] animate-pulse">
          Appuie n'importe où pour stopper
        </p>
      </div>
    );
  }

  const quality = result ? getQualityLabel(result.gap) : null;
  const updatedBest = getDailyBestGap();

  // ────── INTRO + RESULT SCREEN (unified layout) ──────
  return (
    <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-3">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))] shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h1 className="text-lg font-bold text-[hsl(var(--text-primary))]">Défi Précision</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {/* Target card */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-widest mb-1">Cible du jour</p>
              <p className="text-4xl font-mono font-black bg-gradient-primary bg-clip-text text-transparent">
                {target.toFixed(3)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--secondary)/0.2)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center">
              <Target className="w-7 h-7 text-[hsl(var(--primary))]" />
            </div>
          </div>

          {/* Best gap */}
          {updatedBest !== null && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[hsl(var(--wheel-border)/0.3)]">
              <Trophy className="w-3.5 h-3.5 text-[hsl(var(--secondary))]" />
              <span className="text-xs text-[hsl(var(--text-muted))]">Record personnel : <strong className="text-[hsl(var(--secondary))]">{updatedBest.toFixed(3)}</strong></span>
            </div>
          )}
        </div>

        {/* Result card (shown after playing) */}
        {phase === 'result' && result && quality && (
          <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl p-5 space-y-3">
            <div className="text-center">
              <span className="text-2xl">{quality.emoji}</span>
              <p className={`text-xl font-black tracking-wide ${quality.color} mt-1`}>{quality.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase">Cible</p>
                <p className="text-sm font-mono font-bold text-[hsl(var(--primary))]">{result.target.toFixed(3)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase">Ton arrêt</p>
                <p className="text-sm font-mono font-bold text-[hsl(var(--text-primary))]">{result.result.toFixed(3)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase">Écart</p>
                <p className={`text-sm font-mono font-black ${quality.color}`}>{result.gap.toFixed(3)}</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-[hsl(var(--wheel-border)/0.3)]">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
              <span className="text-xs text-[hsl(var(--text-muted))]">Prochain défi dans</span>
              <span className="text-sm font-mono font-bold text-[hsl(var(--text-primary))]">{formatCountdown(countdown)}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        {phase === 'intro' && (
          <Button
            onClick={startTimer}
            className="w-full py-6 text-lg font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_24px_hsl(var(--primary)/0.4)] transition-all duration-300 rounded-2xl"
          >
            <Target className="w-5 h-5 mr-2" />
            Lancer le défi
          </Button>
        )}

        {/* Rules (shown on intro only) */}
        {phase === 'intro' && (
          <div className="bg-[hsl(var(--wheel-base)/0.5)] border border-[hsl(var(--wheel-border)/0.3)] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider">Règles</p>
            <div className="space-y-1.5">
              {[
                'Une seule tentative par jour',
                'Le chrono défile de 0 à 15 en boucle',
                'Arrête-le le plus proche possible de la cible',
                'Ton score est publié dans le classement du jour',
                'Le classement se réinitialise chaque nuit',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[hsl(var(--primary))] text-xs mt-0.5">•</span>
                  <p className="text-xs text-[hsl(var(--text-muted))] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Leaderboard */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--wheel-border)/0.3)]">
            <Users className="w-4 h-4 text-[hsl(var(--primary))]" />
            <p className="text-sm font-bold text-[hsl(var(--text-primary))]">Classement du jour</p>
            <span className="ml-auto text-[10px] text-[hsl(var(--text-muted))] bg-[hsl(var(--button-bg))] px-2 py-0.5 rounded-full">
              {leaderboard.length} joueur{leaderboard.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingLb ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-[hsl(var(--text-muted))]">
                {phase === 'intro' ? 'Sois le premier à relever le défi !' : 'Aucun score pour le moment'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--wheel-border)/0.2)]">
              {leaderboard.map((entry, i) => {
                const rank = i + 1;
                const isMe = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
                const q = getQualityLabel(entry.gap);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isMe ? 'bg-[hsl(var(--primary)/0.08)]' : ''
                    }`}
                  >
                    <div className="w-6 flex justify-center">{getRankIcon(rank)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isMe ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                      }`}>
                        {entry.username}
                        {isMe && <span className="text-[10px] ml-1 text-[hsl(var(--text-muted))]">(toi)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-bold ${q.color}`}>
                        {entry.gap.toFixed(3)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
