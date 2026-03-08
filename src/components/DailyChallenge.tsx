import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Clock, Trophy, Crosshair, Crown, Medal, Users, RotateCcw, Info, Zap, Eye, RefreshCw } from 'lucide-react';
import {
  getDailyTarget,
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

const RULES = [
  { icon: <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />, title: 'Objectif', desc: 'Arrête le chrono le plus proche possible de la cible du jour.' },
  { icon: <Zap className="w-4 h-4 text-[hsl(var(--secondary))]" />, title: 'Vitesse', desc: 'Le compteur défile rapidement de 0.000 à 15.000 en boucle.' },
  { icon: <Eye className="w-4 h-4 text-[hsl(var(--success))]" />, title: 'Précision', desc: 'L\'écart entre ton arrêt et la cible détermine ton classement. Plus il est petit, mieux c\'est !' },
  { icon: <Clock className="w-4 h-4 text-[hsl(var(--danger))]" />, title: 'Une chance par jour', desc: 'Tu n\'as qu\'une seule tentative quotidienne. Pas de seconde chance !' },
  { icon: <Trophy className="w-4 h-4 text-[hsl(var(--secondary))]" />, title: 'Classement', desc: 'Ton score est publié dans le classement du jour qui se réinitialise chaque nuit à minuit.' },
];

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBack }) => {
  const target = getDailyTarget();
  const existingResult = getTodayResult();
  const currentUsername = getUsername();

  // TEST MODE: always allow retrying
  const [phase, setPhase] = useState<Phase>('intro');
  const [timerValue, setTimerValue] = useState(0);
  const [result, setResult] = useState(existingResult);
  const [countdown, setCountdown] = useState(getSecondsUntilNextChallenge());
  const [leaderboard, setLeaderboard] = useState<PrecisionEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bestGap = getDailyBestGap();

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    const data = await fetchDailyPrecisionLeaderboard();
    setLeaderboard(data);
    setLoadingLb(false);
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  useEffect(() => {
    if (phase !== 'result') return;
    const interval = setInterval(() => setCountdown(getSecondsUntilNextChallenge()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

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
    await submitPrecisionScore(t, stopped, gap);
    loadLeaderboard();
  }, [timerValue, loadLeaderboard]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // Retry for testing
  const handleRetry = () => {
    setResult(null);
    setPhase('intro');
  };

  // ────── RUNNING SCREEN ──────
  if (phase === 'running') {
    return (
      <div
        className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 select-none cursor-pointer active:bg-[hsl(var(--game-darker))] transition-colors"
        onPointerDown={stopTimer}
      >
        {/* Target reminder pill */}
        <div className="absolute top-20 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-full px-4 py-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-sm text-[hsl(var(--text-muted))]">Cible :</span>
          <span className="text-sm font-mono font-bold text-[hsl(var(--primary))]">{target.toFixed(3)}</span>
        </div>

        {/* Timer */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]" />
          <p className="relative text-7xl sm:text-8xl font-mono font-black text-[hsl(var(--text-primary))] tabular-nums tracking-tight">
            {timerValue.toFixed(3)}
          </p>
        </div>

        {/* Progress bar visual hint */}
        <div className="w-48 h-1 bg-[hsl(var(--wheel-base))] rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] transition-none"
            style={{ width: `${(timerValue / MAX_VALUE) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-sm text-[hsl(var(--text-muted))] animate-pulse">
          ⬇️ Appuie n'importe où pour stopper
        </p>
      </div>
    );
  }

  const quality = result ? getQualityLabel(result.gap) : null;
  const updatedBest = getDailyBestGap();

  // ────── MAIN SCREEN (intro / result) ──────
  return (
    <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-1">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon" className="text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))] shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary)/0.3)] to-[hsl(var(--secondary)/0.3)] flex items-center justify-center">
              <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-lg font-bold text-[hsl(var(--text-primary))]">Défi Précision</h1>
          </div>
        </div>
        <Button
          onClick={() => setShowRules(!showRules)}
          variant="ghost"
          size="icon"
          className={`text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))] ${showRules ? 'bg-[hsl(var(--button-hover))]' : ''}`}
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>
      <p className="text-xs text-[hsl(var(--text-muted))] px-4 pl-[60px] pb-2">
        Stoppe le chrono au plus près de la cible — une seule chance par jour !
      </p>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Rules panel (togglable) */}
        {showRules && (
          <div className="bg-gradient-to-br from-[hsl(var(--wheel-base))] to-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <p className="text-xs font-bold text-[hsl(var(--text-primary))]">Comment jouer</p>
            </div>
            <div className="space-y-2">
              {RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[hsl(var(--button-bg))] border border-[hsl(var(--wheel-border)/0.3)] flex items-center justify-center shrink-0 mt-0.5">
                    {React.cloneElement(rule.icon as React.ReactElement, { className: 'w-3 h-3' })}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[hsl(var(--text-primary))]">{rule.title}</p>
                    <p className="text-[10px] text-[hsl(var(--text-muted))] leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target card */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-widest mb-0.5">🎯 Cible du jour</p>
              <p className="text-3xl font-mono font-black bg-gradient-primary bg-clip-text text-transparent">
                {target.toFixed(3)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--secondary)/0.15)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center">
              <Target className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>
          </div>
          {updatedBest !== null && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[hsl(var(--wheel-border)/0.3)]">
              <Trophy className="w-3 h-3 text-[hsl(var(--secondary))]" />
              <span className="text-[11px] text-[hsl(var(--text-muted))]">Record : <strong className="text-[hsl(var(--secondary))]">{updatedBest.toFixed(3)}</strong></span>
            </div>
          )}
        </div>

        {/* Result card */}
        {phase === 'result' && result && quality && (
          <div className="bg-gradient-to-br from-[hsl(var(--wheel-base))] to-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-4 space-y-3">
            <div className="text-center space-y-0.5">
              <span className="text-2xl">{quality.emoji}</span>
              <p className={`text-lg font-black tracking-wide ${quality.color}`}>{quality.label}</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Cible', value: result.target.toFixed(3), color: 'text-[hsl(var(--primary))]' },
                { label: 'Ton arrêt', value: result.result.toFixed(3), color: 'text-[hsl(var(--text-primary))]' },
                { label: 'Écart', value: result.gap.toFixed(3), color: quality.color },
              ].map((stat, i) => (
                <div key={i} className="bg-[hsl(var(--button-bg))] border border-[hsl(var(--wheel-border)/0.3)] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[hsl(var(--text-muted))] uppercase mb-0.5">{stat.label}</p>
                  <p className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={handleRetry}
              className="w-full py-4 text-sm font-bold bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_hsl(var(--primary)/0.3)] transition-all duration-300 rounded-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réessayer (test)
            </Button>
            <div className="bg-[hsl(var(--button-bg))] border border-[hsl(var(--wheel-border)/0.3)] rounded-lg p-2.5 flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
              <span className="text-[11px] text-[hsl(var(--text-muted))]">Prochain défi dans</span>
              <span className="text-sm font-mono font-bold text-[hsl(var(--text-primary))]">{formatCountdown(countdown)}</span>
            </div>
          </div>
        )}

        {phase === 'intro' && (
          <Button
            onClick={startTimer}
            className="w-full py-5 text-base font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_24px_hsl(var(--primary)/0.4)] transition-all duration-300 rounded-xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Target className="w-5 h-5 mr-2" />
            Lancer le défi
          </Button>
        )}

        {/* Daily Leaderboard */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--wheel-border)/0.3)] bg-gradient-to-r from-[hsl(var(--wheel-base))] to-[hsl(var(--button-bg))]">
            <Users className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            <p className="text-xs font-bold text-[hsl(var(--text-primary))]">Classement du jour</p>
            <span className="ml-auto text-[9px] text-[hsl(var(--text-muted))] bg-[hsl(var(--game-dark))] px-1.5 py-0.5 rounded-full border border-[hsl(var(--wheel-border)/0.3)]">
              {leaderboard.length} joueur{leaderboard.length !== 1 ? 's' : ''}
            </span>
            <Button onClick={loadLeaderboard} variant="ghost" size="icon" className="w-6 h-6 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))]">
              <RefreshCw className={`w-3 h-3 ${loadingLb ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loadingLb && leaderboard.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <p className="text-[10px] text-[hsl(var(--text-muted))]">Chargement...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-5 text-center space-y-1">
              <span className="text-2xl">🏆</span>
              <p className="text-xs font-medium text-[hsl(var(--text-secondary))]">Aucun score aujourd'hui</p>
              <p className="text-[10px] text-[hsl(var(--text-muted))]">Sois le premier à relever le défi !</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--wheel-border)/0.15)]">
              {leaderboard.map((entry, i) => {
                const rank = i + 1;
                const isMe = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
                const q = getQualityLabel(entry.gap);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${
                      isMe ? 'bg-[hsl(var(--primary)/0.1)] border-l-2 border-l-[hsl(var(--primary))]' : ''
                    }`}
                  >
                    <div className="w-5 flex justify-center shrink-0">{getRankIcon(rank)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        isMe ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                      }`}>
                        {entry.username}
                        {isMe && <span className="text-[9px] ml-1 text-[hsl(var(--primary)/0.7)]">(toi)</span>}
                      </p>
                    </div>
                    <p className={`text-xs font-mono font-bold shrink-0 ${q.color}`}>
                      {entry.gap.toFixed(3)}
                    </p>
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
