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
  formatCountdown } from
'@/utils/dailyChallenge';
import { submitPrecisionScore, fetchDailyPrecisionLeaderboard, fetchYesterdayPrecisionLeaderboard, type PrecisionEntry } from '@/utils/precisionApi';
import { getUsername } from '@/utils/localIdentity';
import { applyDecoration } from '@/utils/seasonPass';
import { useLanguage, translations } from '@/hooks/useLanguage';

interface DailyChallengeProps {
  onBack: () => void;
}

type Phase = 'intro' | 'ready' | 'running' | 'stopped' | 'result';

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-[hsl(var(--text-muted))] font-mono w-4 text-center">{rank}</span>;
};

// Decoration helpers (same as OnlineLeaderboard)
const hasPurpleName = (d: string | null | undefined) => d?.split(',').map((s) => s.trim()).includes('purple_name') ?? false;
const hasPulseName = (d: string | null | undefined) => d?.split(',').map((s) => s.trim()).includes('pulse_name') ?? false;
const hasGoldPulseName = (d: string | null | undefined) => d?.split(',').map((s) => s.trim()).includes('gold_pulse_name') ?? false;

const getNameColor = (decorations: string | null | undefined): string => {
  if (hasGoldPulseName(decorations)) return 'hsl(45, 100%, 55%)';
  if (hasPulseName(decorations)) return 'hsl(var(--primary))';
  if (hasPurpleName(decorations)) return '#a855f7';
  return 'hsl(var(--text-primary))';
};

const getNameAnimation = (decorations: string | null | undefined): string => {
  if (hasGoldPulseName(decorations)) return 'animate-[username-gold-pulse_3s_ease-in-out_infinite]';
  if (hasPulseName(decorations)) return 'animate-[username-pulse_3s_ease-in-out_infinite]';
  return '';
};

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const t = translations[language];

  const getQualityLabel = (gap: number): {label: string;color: string;emoji: string;} => {
    if (gap <= 0.005) return { label: t.precisionPerfect, color: 'text-[hsl(var(--success))]', emoji: '🎯' };
    if (gap <= 0.05) return { label: t.precisionIncredible, color: 'text-[hsl(var(--success))]', emoji: '🔥' };
    if (gap <= 0.1) return { label: t.precisionExcellent, color: 'text-[hsl(var(--primary))]', emoji: '⚡' };
    if (gap <= 0.3) return { label: t.precisionVeryGood, color: 'text-[hsl(var(--primary))]', emoji: '✨' };
    if (gap <= 0.5) return { label: t.precisionGoodLabel, color: 'text-[hsl(var(--secondary))]', emoji: '👍' };
    if (gap <= 1.0) return { label: t.precisionNotBad, color: 'text-[hsl(var(--text-secondary))]', emoji: '👌' };
    return { label: t.precisionTryAgain, color: 'text-[hsl(var(--danger))]', emoji: '💪' };
  };

  const RULES = [
  { icon: <Crosshair className="w-4 h-4 text-[hsl(var(--primary))]" />, title: t.precisionRuleObjective, desc: t.precisionRuleObjectiveDesc },
  { icon: <Zap className="w-4 h-4 text-[hsl(var(--secondary))]" />, title: t.precisionRuleSpeed, desc: t.precisionRuleSpeedDesc },
  { icon: <Eye className="w-4 h-4 text-[hsl(var(--success))]" />, title: t.precisionRulePrecision, desc: t.precisionRulePrecisionDesc },
  { icon: <Clock className="w-4 h-4 text-[hsl(var(--danger))]" />, title: t.precisionRuleOneChance, desc: t.precisionRuleOneChanceDesc },
  { icon: <Trophy className="w-4 h-4 text-[hsl(var(--secondary))]" />, title: t.precisionRuleLeaderboard, desc: t.precisionRuleLeaderboardDesc }];


  const target = getDailyTarget();
  const existingResult = getTodayResult();
  const currentUsername = getUsername();

  const [phase, setPhase] = useState<Phase>('intro');
  const [timerValue, setTimerValue] = useState(0);
  const [stoppedValue, setStoppedValue] = useState<number | null>(null);
  const [result, setResult] = useState(existingResult);
  const [countdown, setCountdown] = useState(getSecondsUntilNextChallenge());
  const [leaderboard, setLeaderboard] = useState<PrecisionEntry[]>([]);
  const [yesterdayLb, setYesterdayLb] = useState<PrecisionEntry[]>([]);
  const [lbTab, setLbTab] = useState<'today' | 'yesterday'>('today');
  const [loadingLb, setLoadingLb] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    const [todayData, yesterdayData] = await Promise.all([
    fetchDailyPrecisionLeaderboard(),
    fetchYesterdayPrecisionLeaderboard()]
    );
    setLeaderboard(todayData);
    setYesterdayLb(yesterdayData);
    setLoadingLb(false);
  }, []);

  useEffect(() => {loadLeaderboard();}, [loadLeaderboard]);

  useEffect(() => {
    if (phase !== 'result' && phase !== 'stopped') return;
    const interval = setInterval(() => setCountdown(getSecondsUntilNextChallenge()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const SPEED = 2.5;
  const MAX_VALUE = 15;

  const goToReady = useCallback(() => {
    setPhase('ready');
  }, []);

  const startTimer = useCallback(() => {
    setPhase('running');
    setTimerValue(0);
    startTimeRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setTimerValue(elapsed * SPEED % MAX_VALUE);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const stopped = Math.round(timerValue * 1000) / 1000;
    setStoppedValue(stopped);
    const { gap, target: tgt } = recordDailyResult(stopped);
    updateDailyBest(gap);
    setResult({ result: stopped, gap, target: tgt });
    setPhase('stopped');
    submitPrecisionScore(tgt, stopped, gap).then(() => loadLeaderboard());
  }, [timerValue, loadLeaderboard]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const handleRetry = () => {
    setResult(null);
    setStoppedValue(null);
    setPhase('intro');
  };

  const handleSeeResults = () => {
    setPhase('result');
  };

  // ────── READY SCREEN ──────
  if (phase === 'ready') {
    return (
      <div
        className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 select-none cursor-pointer active:bg-[hsl(var(--game-darker))] transition-colors"
        onPointerDown={startTimer}>
        
        <div className="absolute top-20 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-full px-4 py-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-sm text-[hsl(var(--text-muted))]">{t.precisionTarget}</span>
          <span className="text-sm font-mono font-bold text-[hsl(var(--primary))]">{target.toFixed(3)}</span>
        </div>

        <div className="text-center space-y-4">
          <p className="text-6xl sm:text-7xl font-mono font-black text-[hsl(var(--text-muted)/0.3)] tabular-nums">
            0.000
          </p>
          <div className="space-y-2">
            <p className="text-lg font-bold text-[hsl(var(--text-primary))]">{t.precisionReady}</p>
            <p className="text-sm text-[hsl(var(--text-muted))] animate-pulse">
              {t.precisionTapToStart}
            </p>
          </div>
        </div>
      </div>);

  }

  // ────── RUNNING SCREEN ──────
  if (phase === 'running') {
    return (
      <div
        className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 select-none cursor-pointer active:bg-[hsl(var(--game-darker))] transition-colors"
        onPointerDown={stopTimer}>
        
        <div className="absolute top-20 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-full px-4 py-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-[hsl(var(--primary))]" />
          <span className="text-sm text-[hsl(var(--text-muted))]">{t.precisionTarget}</span>
          <span className="text-sm font-mono font-bold text-[hsl(var(--primary))]">{target.toFixed(3)}</span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]" />
          <p className="relative text-7xl sm:text-8xl font-mono font-black text-[hsl(var(--text-primary))] tabular-nums tracking-tight">
            {timerValue.toFixed(3)}
          </p>
        </div>

        <div className="w-48 h-1 bg-[hsl(var(--wheel-base))] rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] transition-none"
            style={{ width: `${timerValue / MAX_VALUE * 100}%` }} />
          
        </div>

        <p className="mt-6 text-sm text-[hsl(var(--text-muted))] animate-pulse">
          {t.precisionTapToStop}
        </p>
      </div>);

  }

  // ────── STOPPED SCREEN ──────
  if (phase === 'stopped' && result) {
    const q = getQualityLabel(result.gap);
    // Compute top % from leaderboard (already loaded, no extra call)
    const myRank = leaderboard.findIndex(e => currentUsername && e.username.toLowerCase() === currentUsername.toLowerCase()) + 1;
    const totalPlayers = leaderboard.length;
    const topPercent = myRank > 0 && totalPlayers > 0 ? Math.max(1, Math.round((myRank / totalPlayers) * 100)) : null;

    return (
      <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <span className="text-6xl mb-3">{q.emoji}</span>
          
          {topPercent !== null ? (
            <div className="text-center mb-6">
              <p className="text-3xl font-black tracking-wide text-[hsl(var(--primary))]">
                Top {topPercent}%
              </p>
              <p className="text-[11px] text-[hsl(var(--text-muted))] mt-1">
                {t.precisionTopForNow}
              </p>
            </div>
          ) : (
            <p className={`text-3xl font-black tracking-wide ${q.color} mb-6`}>{q.label}</p>
          )}

          <div className="relative mb-4">
            <div className="absolute inset-0 blur-3xl opacity-15 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))]" />
            <p className="relative text-6xl sm:text-7xl font-mono font-black text-[hsl(var(--text-primary))] tabular-nums">
              {result.result.toFixed(3)}
            </p>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="text-center">
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase">{t.precisionTargetLabel}</p>
              <p className="text-lg font-mono font-bold text-[hsl(var(--primary))]">{result.target.toFixed(3)}</p>
            </div>
            <div className="w-px h-8 bg-[hsl(var(--wheel-border)/0.5)]" />
            <div className="text-center">
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase">{t.precisionGap}</p>
              <p className={`text-lg font-mono font-black ${q.color}`}>{result.gap.toFixed(3)}</p>
            </div>
          </div>

          <Button
            onClick={handleSeeResults}
            className="px-8 py-4 text-sm font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_20px_hsl(var(--primary)/0.3)] transition-all duration-300 rounded-xl">
            
            {t.precisionViewLeaderboardBtn}
          </Button>
        </div>
      </div>);

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
            <h1 className="text-lg font-bold text-[hsl(var(--text-primary))]">{t.precisionTitle}</h1>
          </div>
        </div>
        <Button
          onClick={() => setShowRules(!showRules)}
          variant="ghost"
          size="icon"
          className={`text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))] ${showRules ? 'bg-[hsl(var(--button-hover))]' : ''}`}>
          
          <Info className="w-5 h-5" />
        </Button>
      </div>

      <p className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent px-4 pl-[60px] pb-3 text-center">
        {t.precisionSubtitle}
      </p>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Rules panel */}
        {showRules &&
        <div className="bg-gradient-to-br from-[hsl(var(--wheel-base))] to-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{t.precisionHowToPlay}</p>
            </div>
            <div className="space-y-2">
              {RULES.map((rule, i) =>
            <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-[hsl(var(--button-bg))] border border-[hsl(var(--wheel-border)/0.3)] flex items-center justify-center shrink-0 mt-0.5">
                    {React.cloneElement(rule.icon as React.ReactElement, { className: 'w-3 h-3' })}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[hsl(var(--text-primary))]">{rule.title}</p>
                    <p className="text-[10px] text-[hsl(var(--text-muted))] leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
            )}
            </div>
          </div>
        }

        {/* Target card */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[hsl(var(--text-muted))] uppercase tracking-widest mb-0.5">{t.precisionTargetOfDay}</p>
              <p className="text-3xl font-mono font-black bg-gradient-primary bg-clip-text text-transparent">
                {target.toFixed(3)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--secondary)/0.15)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center">
              <Target className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>
          </div>
          {updatedBest !== null &&
          <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[hsl(var(--wheel-border)/0.3)]">
              <Trophy className="w-3 h-3 text-[hsl(var(--secondary))]" />
              <span className="text-[11px] text-[hsl(var(--text-muted))]">{t.precisionRecord} <strong className="text-[hsl(var(--secondary))]">{updatedBest.toFixed(3)}</strong></span>
            </div>
          }
        </div>

        {/* Result card */}
        {phase === 'result' && result && quality &&
        <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(var(--wheel-base))] to-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-3 space-y-2.5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[hsl(var(--primary)/0.08)] to-transparent rounded-bl-full" />

            <div className="relative grid grid-cols-3 gap-1.5">
              {[
            { label: t.precisionTargetLabel, value: result.target.toFixed(3), color: 'text-[hsl(var(--primary))]' },
            { label: t.precisionYourStop, value: result.result.toFixed(3), color: 'text-[hsl(var(--text-primary))]' },
            { label: t.precisionGap, value: result.gap.toFixed(3), color: quality.color }].
            map((stat, i) =>
            <div key={i} className="bg-[hsl(var(--game-dark)/0.6)] backdrop-blur-sm border border-[hsl(var(--wheel-border)/0.2)] rounded-lg p-2 text-center">
                  <p className="text-[9px] text-[hsl(var(--text-muted))] uppercase mb-0.5">{stat.label}</p>
                  <p className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</p>
                </div>
            )}
            </div>


            <div className="relative bg-[hsl(var(--game-dark)/0.5)] border border-[hsl(var(--wheel-border)/0.2)] rounded-lg p-2.5 flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" />
              <span className="text-[11px] text-[hsl(var(--text-muted))]">{t.precisionNextChallenge}</span>
              <span className="text-sm font-mono font-bold text-[hsl(var(--text-primary))]">{formatCountdown(countdown)}</span>
            </div>
          </div>
        }

        {/* Launch button */}
        {phase === 'intro' &&
        <Button
          onClick={goToReady}
          className="w-full py-5 text-base font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_24px_hsl(var(--primary)/0.4)] transition-all duration-300 rounded-xl relative overflow-hidden group">
          
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Target className="w-5 h-5 mr-2" />
            {t.precisionLaunch}
          </Button>
        }

        {/* My position bubble */}
        {(() => {
          const activeList = lbTab === 'today' ? leaderboard : yesterdayLb;
          const myIndex = activeList.findIndex(e => currentUsername && e.username.toLowerCase() === currentUsername.toLowerCase());
          if (myIndex < 0) {
            // Player not in top 1000 — show explanation
            if (result && phase === 'result') {
              return (
                <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--game-dark))] border border-[hsl(var(--wheel-border)/0.3)] flex items-center justify-center shrink-0">
                    <span className="text-sm">📊</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[hsl(var(--text-secondary))]">{t.precisionNotInTop}</p>
                    <p className="text-[10px] text-[hsl(var(--text-muted))]">{t.precisionNotInTopDesc}</p>
                  </div>
                </div>
              );
            }
            return null;
          }
          const myRank = myIndex + 1;
          const myEntry = activeList[myIndex];
          const myQ = getQualityLabel(myEntry.gap);
          return (
            <div className="bg-gradient-to-r from-[hsl(var(--primary)/0.15)] to-[hsl(var(--secondary)/0.1)] border border-[hsl(var(--primary)/0.3)] rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-white">#{myRank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[hsl(var(--text-primary))] truncate">{t.precisionYourRank}</p>
                <p className="text-[10px] text-[hsl(var(--text-muted))]">
                  {t.precisionOutOf} {activeList.length} {t.precisionPlayers}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-mono font-bold ${myQ.color}`}>{myEntry.gap.toFixed(3)}</p>
                <p className="text-[9px] text-[hsl(var(--text-muted))]">{t.precisionGap}</p>
              </div>
            </div>
          );
        })()}

        {/* Daily Leaderboard */}
        <div className="bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--wheel-border)/0.3)] bg-gradient-to-r from-[hsl(var(--wheel-base))] to-[hsl(var(--button-bg))]">
            <Users className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{t.precisionLeaderboard}</p>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setLbTab('today')}
                className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
                lbTab === 'today' ?
                'bg-[hsl(var(--primary)/0.2)] border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))] font-bold' :
                'bg-[hsl(var(--game-dark))] border-[hsl(var(--wheel-border)/0.3)] text-[hsl(var(--text-muted))]'}`
                }>
                
                {t.precisionToday} ({leaderboard.length})
              </button>
              <button
                onClick={() => setLbTab('yesterday')}
                className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
                lbTab === 'yesterday' ?
                'bg-[hsl(var(--primary)/0.2)] border-[hsl(var(--primary)/0.4)] text-[hsl(var(--primary))] font-bold' :
                'bg-[hsl(var(--game-dark))] border-[hsl(var(--wheel-border)/0.3)] text-[hsl(var(--text-muted))]'}`
                }>
                
                {t.precisionYesterday} ({yesterdayLb.length})
              </button>
            </div>
            <Button onClick={loadLeaderboard} variant="ghost" size="icon" className="w-6 h-6 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))]">
              <RefreshCw className={`w-3 h-3 ${loadingLb ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {(() => {
            const activeList = lbTab === 'today' ? leaderboard : yesterdayLb;
            const maxDisplay = lbTab === 'today' ? 1000 : 50;

            if (loadingLb && activeList.length === 0) {
              return (
                <div className="p-6 text-center">
                  <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                  <p className="text-[10px] text-[hsl(var(--text-muted))]">{t.precisionLoading}</p>
                </div>);

            }
            if (activeList.length === 0) {
              return (
                <div className="p-5 text-center space-y-1">
                  <span className="text-2xl">🏆</span>
                  <p className="text-xs font-medium text-[hsl(var(--text-secondary))]">
                    {lbTab === 'today' ? t.precisionNoScoresToday : t.precisionNoScoresYesterday}
                  </p>
                  <p className="text-[10px] text-[hsl(var(--text-muted))]">
                    {lbTab === 'today' ? t.precisionBeFirst : t.precisionNoDataYesterday}
                  </p>
                </div>);

            }
            return (
              <div className="divide-y divide-[hsl(var(--wheel-border)/0.15)]">
                {activeList.slice(0, maxDisplay).map((entry, i) => {
                  const rank = i + 1;
                  const isMe = currentUsername && entry.username.toLowerCase() === currentUsername.toLowerCase();
                  const q = getQualityLabel(entry.gap);
                  const displayName = entry.username.length > 14 ? `${entry.username.substring(0, 14)}…` : entry.username;
                  const decoratedName = applyDecoration(displayName, entry.decorations || null);
                  const nameColor = isMe ? 'hsl(var(--primary))' : getNameColor(entry.decorations);
                  const nameAnim = getNameAnimation(entry.decorations);

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-2.5 px-3 py-2 transition-colors ${
                      isMe ? 'bg-[hsl(var(--primary)/0.1)] border-l-2 border-l-[hsl(var(--primary))]' : ''}`
                      }>
                      
                      <div className="w-5 flex justify-center shrink-0">{getRankIcon(rank)}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${nameAnim}`}
                          style={{ color: nameColor }}>
                          
                          {decoratedName}
                          {isMe && <span className="text-[9px] ml-1 opacity-60">{t.precisionYou}</span>}
                        </p>
                      </div>
                      <p className={`text-xs font-mono font-bold shrink-0 ${q.color}`}>
                        {entry.gap.toFixed(3)}
                      </p>
                    </div>);

                })}
              </div>);

          })()}
        </div>
      </div>
    </div>);

};