import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap, Play, RotateCcw, Info, Crown, Medal } from 'lucide-react';
import { submitReflexGridScore, fetchReflexGridLeaderboard, type ReflexGridEntry } from '@/utils/reflexGridApi';
import { getUsername } from '@/utils/localIdentity';
import { useLanguage } from '@/hooks/useLanguage';

interface ReflexGridProps {
  onBack: () => void;
}

type Phase = 'intro' | 'playing' | 'gameover';
type CellState = 'idle' | 'green' | 'red';

const GRID_SIZE = 3; // 3x3
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
const BEST_KEY = 'reflex_grid_best';

// Difficulty curves — index by score
function greenDurationMs(score: number): number {
  // starts at 900ms, floor 320ms
  return Math.max(320, 900 - score * 12);
}
function nextSpawnDelayMs(score: number): number {
  // spawn gap between rounds
  return Math.max(140, 420 - score * 6);
}
function decoyChance(score: number): number {
  // probability of a red decoy appearing alongside the green target
  return Math.min(0.75, score * 0.02);
}
function decoyCount(score: number): number {
  if (score < 10) return 1;
  if (score < 25) return 2;
  if (score < 50) return 3;
  return 4;
}

export const ReflexGrid: React.FC<ReflexGridProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [cells, setCells] = useState<CellState[]>(() => Array(TOTAL_CELLS).fill('idle'));
  const [best, setBest] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch { return 0; }
  });
  const [leaderboard, setLeaderboard] = useState<ReflexGridEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const scoreRef = useRef(0);
  const greenIndexRef = useRef<number>(-1);
  const roundTimeoutRef = useRef<number | null>(null);
  const spawnTimeoutRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const currentUsername = getUsername();

  const T = {
    fr: {
      title: 'Reflex Grid',
      subtitle: 'Tape le vert. Évite le rouge.',
      start: 'Commencer',
      retry: 'Rejouer',
      back: 'Retour',
      score: 'Score',
      best: 'Record',
      leaderboard: 'Classement',
      loading: 'Chargement…',
      empty: 'Aucun score pour le moment',
      howTo: 'Comment jouer',
      rule1: 'Une case verte apparaît : tape-la avant qu\'elle ne disparaisse.',
      rule2: 'Des cases rouges (leurres) apparaissent : NE PAS taper.',
      rule3: 'Le rythme s\'accélère et les leurres se multiplient.',
      rule4: 'Une seule erreur (leurre tapé ou vert manqué) = fin de partie.',
      gameover: 'Terminé',
      newBest: 'Nouveau record !',
      submitted: 'Score envoyé au classement',
    },
    en: {
      title: 'Reflex Grid',
      subtitle: 'Tap green. Avoid red.',
      start: 'Start',
      retry: 'Retry',
      back: 'Back',
      score: 'Score',
      best: 'Best',
      leaderboard: 'Leaderboard',
      loading: 'Loading…',
      empty: 'No scores yet',
      howTo: 'How to play',
      rule1: 'A green cell appears: tap it before it disappears.',
      rule2: 'Red cells (decoys) appear: DO NOT tap them.',
      rule3: 'Pace accelerates, decoys multiply.',
      rule4: 'One mistake (tapped decoy or missed green) = game over.',
      gameover: 'Game Over',
      newBest: 'New record!',
      submitted: 'Score submitted to leaderboard',
    },
    es: {
      title: 'Reflex Grid',
      subtitle: 'Toca el verde. Evita el rojo.',
      start: 'Empezar',
      retry: 'Reintentar',
      back: 'Volver',
      score: 'Puntos',
      best: 'Récord',
      leaderboard: 'Clasificación',
      loading: 'Cargando…',
      empty: 'Sin puntuaciones aún',
      howTo: 'Cómo jugar',
      rule1: 'Aparece una celda verde: tócala antes de que desaparezca.',
      rule2: 'Aparecen celdas rojas (señuelos): NO las toques.',
      rule3: 'El ritmo se acelera, los señuelos aumentan.',
      rule4: 'Un solo error (señuelo tocado o verde perdido) = fin del juego.',
      gameover: 'Fin de partida',
      newBest: '¡Nuevo récord!',
      submitted: 'Puntuación enviada al ranking',
    },
  }[language];

  const clearTimers = () => {
    if (roundTimeoutRef.current) { clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
    if (spawnTimeoutRef.current) { clearTimeout(spawnTimeoutRef.current); spawnTimeoutRef.current = null; }
  };

  const loadLb = useCallback(async () => {
    setLoadingLb(true);
    try {
      const data = await fetchReflexGridLeaderboard(200);
      setLeaderboard(data);
    } finally {
      setLoadingLb(false);
    }
  }, []);

  useEffect(() => { loadLb(); }, [loadLb]);

  useEffect(() => () => clearTimers(), []);

  const endGame = useCallback(async (finalScore: number) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setCells(prev => prev.map(c => (c === 'green' ? 'red' : c)));
    setPhase('gameover');

    // Update local best
    const prevBest = (() => { try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch { return 0; } })();
    if (finalScore > prevBest) {
      try { localStorage.setItem(BEST_KEY, String(finalScore)); } catch { /* ignore */ }
      setBest(finalScore);
    }

    if (finalScore > 0 && currentUsername) {
      await submitReflexGridScore(finalScore);
      loadLb();
    }
  }, [currentUsername, loadLb]);

  const scheduleRound = useCallback(() => {
    if (!activeRef.current) return;
    const s = scoreRef.current;
    // Pick green index
    const greenIdx = Math.floor(Math.random() * TOTAL_CELLS);
    greenIndexRef.current = greenIdx;

    // Pick decoys
    const decoys = new Set<number>();
    if (Math.random() < decoyChance(s)) {
      const nDecoys = decoyCount(s);
      let attempts = 0;
      while (decoys.size < nDecoys && attempts < 30) {
        const idx = Math.floor(Math.random() * TOTAL_CELLS);
        if (idx !== greenIdx) decoys.add(idx);
        attempts++;
      }
    }

    setCells(() => {
      const next: CellState[] = Array(TOTAL_CELLS).fill('idle');
      next[greenIdx] = 'green';
      decoys.forEach(i => { next[i] = 'red'; });
      return next;
    });

    const duration = greenDurationMs(s);
    roundTimeoutRef.current = window.setTimeout(() => {
      // Missed green — game over
      endGame(scoreRef.current);
    }, duration);
  }, [endGame]);

  const nextRound = useCallback(() => {
    if (!activeRef.current) return;
    setCells(() => Array(TOTAL_CELLS).fill('idle'));
    spawnTimeoutRef.current = window.setTimeout(() => {
      scheduleRound();
    }, nextSpawnDelayMs(scoreRef.current));
  }, [scheduleRound]);

  const handleCellTap = (idx: number) => {
    if (!activeRef.current) return;
    const state = cells[idx];
    if (state === 'green') {
      // Hit! clear round timeout, increment score, next round
      if (roundTimeoutRef.current) { clearTimeout(roundTimeoutRef.current); roundTimeoutRef.current = null; }
      scoreRef.current += 1;
      setScore(scoreRef.current);
      nextRound();
    } else if (state === 'red') {
      // Bad tap — game over
      endGame(scoreRef.current);
    } else {
      // Tapped an idle cell = mistake too
      endGame(scoreRef.current);
    }
  };

  const startGame = () => {
    clearTimers();
    scoreRef.current = 0;
    setScore(0);
    setCells(Array(TOTAL_CELLS).fill('idle'));
    activeRef.current = true;
    setPhase('playing');
    // First green after short delay
    spawnTimeoutRef.current = window.setTimeout(() => scheduleRound(), 600);
  };

  const getRankIcon = (r: number) => {
    if (r === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (r === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (r === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-[hsl(var(--text-muted))] font-mono w-4 text-center">{r}</span>;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-2">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon" className="text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))] shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary)/0.3)] to-[hsl(var(--secondary)/0.3)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-lg font-bold text-[hsl(var(--text-primary))]">{T.title}</h1>
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

      <p className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent px-4 pb-3 text-center">
        {T.subtitle}
      </p>

      {/* Rules panel */}
      {showRules && (
        <div className="mx-4 mb-3 bg-gradient-to-br from-[hsl(var(--wheel-base))] to-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.5)] rounded-xl p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
            <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{T.howTo}</p>
          </div>
          <ul className="text-[11px] text-[hsl(var(--text-secondary))] space-y-1 list-disc list-inside">
            <li>{T.rule1}</li>
            <li>{T.rule2}</li>
            <li>{T.rule3}</li>
            <li>{T.rule4}</li>
          </ul>
        </div>
      )}

      {/* Score bar */}
      <div className="flex items-center justify-center gap-4 px-4 pb-3">
        <div className="flex items-center gap-2 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-full px-4 py-1.5">
          <Zap className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          <span className="text-xs text-[hsl(var(--text-muted))]">{T.score}</span>
          <span className="text-sm font-bold font-mono text-[hsl(var(--primary))] tabular-nums">{score}</span>
        </div>
        <div className="flex items-center gap-2 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-full px-4 py-1.5">
          <Trophy className="w-3.5 h-3.5 text-[hsl(var(--secondary))]" />
          <span className="text-xs text-[hsl(var(--text-muted))]">{T.best}</span>
          <span className="text-sm font-bold font-mono text-[hsl(var(--secondary))] tabular-nums">{best}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4">
        <div className="mx-auto max-w-[360px] aspect-square grid grid-cols-3 gap-2.5 p-2.5 bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] rounded-2xl">
          {cells.map((c, i) => {
            const base = 'rounded-xl transition-colors duration-150 active:scale-95 select-none';
            const styleByState =
              c === 'green'
                ? 'bg-[hsl(var(--success))] shadow-[0_0_24px_hsl(var(--success)/0.7)]'
                : c === 'red'
                  ? 'bg-[hsl(var(--danger))] shadow-[0_0_18px_hsl(var(--danger)/0.5)]'
                  : 'bg-[hsl(var(--game-darker))] border border-[hsl(var(--wheel-border)/0.4)]';
            return (
              <button
                key={i}
                type="button"
                aria-label={`cell-${i}`}
                onPointerDown={() => handleCellTap(i)}
                className={`${base} ${styleByState}`}
                disabled={phase !== 'playing'}
              />
            );
          })}
        </div>
      </div>

      {/* Controls / status */}
      <div className="px-4 py-4 flex flex-col items-center gap-2">
        {phase === 'intro' && (
          <Button
            onClick={startGame}
            className="px-8 py-4 text-sm font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_20px_hsl(var(--primary)/0.3)] transition-all duration-300 rounded-xl"
          >
            <Play className="w-4 h-4 mr-2" />
            {T.start}
          </Button>
        )}
        {phase === 'gameover' && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--text-muted))]">{T.gameover}</p>
            {score > 0 && score >= best && (
              <p className="text-xs font-semibold text-[hsl(var(--secondary))]">{T.newBest}</p>
            )}
            <Button
              onClick={startGame}
              className="px-8 py-3 text-sm font-bold bg-gradient-primary hover:scale-[1.03] active:scale-[0.98] shadow-[0_4px_20px_hsl(var(--primary)/0.3)] transition-all duration-300 rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {T.retry}
            </Button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--secondary))]" />
          <h2 className="text-sm font-bold text-[hsl(var(--text-primary))]">{T.leaderboard}</h2>
        </div>
        {loadingLb ? (
          <p className="text-xs text-[hsl(var(--text-muted))] text-center py-6">{T.loading}</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-[hsl(var(--text-muted))] text-center py-6">{T.empty}</p>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((e, i) => {
              const isMe = currentUsername && e.username.toLowerCase() === currentUsername.toLowerCase();
              return (
                <div
                  key={e.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    isMe
                      ? 'bg-[hsl(var(--primary)/0.12)] border-[hsl(var(--primary)/0.5)]'
                      : 'bg-[hsl(var(--wheel-base))] border-[hsl(var(--wheel-border)/0.4)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 flex justify-center">{getRankIcon(i + 1)}</div>
                    <span className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{e.username}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[hsl(var(--primary))] tabular-nums">{e.best_score}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
