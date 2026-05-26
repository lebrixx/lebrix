import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { Capacitor } from '@capacitor/core';
import { useLanguage, translations } from '@/hooks/useLanguage';

/**
 * Reflex 3D — experimental mode.
 * Self-contained. Does NOT submit to leaderboards. Does NOT touch ModeType / cfgModes.
 * Uses CSS 3D transforms over an SVG ring (lightweight, no Three.js needed).
 */

interface Reflex3DModeProps {
  theme: string;
  onBack?: () => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playClick?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
}

// ─── Tunables (easy to tweak) ───
const RADIUS = 130;
const PADDING = 50;
const SVG_SIZE = RADIUS * 2 + PADDING * 2;
const CENTER = RADIUS + PADDING;
const BALL_RADIUS = 9;
const BASE_ZONE_ARC = Math.PI / 4;       // 45° start
const MIN_ZONE_ARC = Math.PI / 10;       // ~18° floor
const BASE_SPEED = 1.6;                  // rad/s
const SPEED_GAIN = 1.045;                // +4.5% / success
const MAX_SPEED = 8.0;                   // rad/s cap
const SHRINK_EVERY = 5;
const SHRINK_FACTOR = 0.92;
const TAU = Math.PI * 2;
const DEBOUNCE_MS = 50;

const norm = (a: number) => ((a % TAU) + TAU) % TAU;
const angleInArc = (a: number, start: number, arc: number) => {
  const x = norm(a);
  const s = norm(start);
  const e = norm(start + arc);
  if (s <= e) return x >= s && x <= e;
  return x >= s || x <= e;
};

const BEST_KEY = 'bestScore_reflex_3d';

export const Reflex3DMode: React.FC<Reflex3DModeProps> = ({
  theme,
  onBack,
  isSoundMuted = false,
  onToggleSound = () => {},
  playClick = () => {},
  playSuccess = () => {},
  playFailure = () => {},
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const themeDef = THEMES.find((th) => th.id === theme) || THEMES[0];
  const zoneColor = themeDef.preview.successZone;
  const barColor = themeDef.preview.circle;
  const backgroundCss = themeDef.preview.background;
  const isAndroid = useMemo(() => Capacitor.getPlatform() === 'android', []);

  const [status, setStatus] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('luckyStopGame');
      if (!saved) return 0;
      return JSON.parse(saved)[BEST_KEY] || 0;
    } catch { return 0; }
  });
  const [flash, setFlash] = useState<'success' | 'failure' | null>(null);
  const [shake, setShake] = useState(false);

  // Refs (engine state)
  const ballAngleRef = useRef(0);
  const ballDirRef = useRef(1);
  const speedRef = useRef(BASE_SPEED);
  const zoneArcRef = useRef(BASE_ZONE_ARC);
  const zoneStartRef = useRef(0);
  const fakeZonesRef = useRef<number[]>([]); // start angles of decoy red zones
  const lastFrameRef = useRef(0);
  const lastTapRef = useRef(0);
  const rafRef = useRef(0);
  const statusRef = useRef<typeof status>('idle');
  const scoreRef = useRef(0);

  // Visual: tilt & camera rotation
  const [cameraRot, setCameraRot] = useState(0); // deg, oscillates after 10 pts
  const [tiltX, setTiltX] = useState(50);        // deg base tilt
  const [trail, setTrail] = useState<number[]>([]); // recent ball angles for streak

  // Force re-render at 60fps for ball position
  const [, forceTick] = useState(0);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const placeZone = useCallback(() => {
    // Far enough from current ball position
    let s: number;
    let tries = 0;
    do {
      s = Math.random() * TAU;
      tries++;
    } while (
      tries < 10 &&
      Math.abs(norm(s + zoneArcRef.current / 2 - ballAngleRef.current)) < zoneArcRef.current
    );
    zoneStartRef.current = s;

    // Decoy zones from score 20+
    if (scoreRef.current >= 20) {
      const decoys: number[] = [];
      const count = scoreRef.current >= 35 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        let d: number;
        let t2 = 0;
        do {
          d = Math.random() * TAU;
          t2++;
        } while (
          t2 < 10 &&
          Math.abs(norm(d - s)) < zoneArcRef.current * 1.5
        );
        decoys.push(d);
      }
      fakeZonesRef.current = decoys;
    } else {
      fakeZonesRef.current = [];
    }
  }, []);

  const resetEngine = useCallback(() => {
    ballAngleRef.current = -Math.PI / 2;
    ballDirRef.current = Math.random() < 0.5 ? 1 : -1;
    speedRef.current = BASE_SPEED;
    zoneArcRef.current = BASE_ZONE_ARC;
    fakeZonesRef.current = [];
    placeZone();
    setTrail([]);
    setCameraRot(0);
    setTiltX(50);
  }, [placeZone]);

  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    resetEngine();
    setStatus('running');
    setFlash(null);
    lastFrameRef.current = performance.now();
  }, [resetEngine]);

  const endGame = useCallback(() => {
    setStatus('gameover');
    playFailure();
    setFlash('failure');
    setShake(true);
    setTimeout(() => setShake(false), 350);
    // Persist best score locally only
    setBestScore((prev) => {
      const next = Math.max(prev, scoreRef.current);
      try {
        const data = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
        data[BEST_KEY] = next;
        localStorage.setItem('luckyStopGame', JSON.stringify(data));
      } catch { }
      return next;
    });
    // Vibrate briefly
    try { (navigator as any).vibrate?.(80); } catch { }
  }, [playFailure]);

  // Main loop
  useEffect(() => {
    const loop = (now: number) => {
      if (statusRef.current !== 'running') {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      ballAngleRef.current = norm(
        ballAngleRef.current + ballDirRef.current * speedRef.current * dt
      );

      // Camera oscillation past 10 pts
      if (scoreRef.current >= 10) {
        const t2 = now / 1000;
        const amp = Math.min(18, 6 + (scoreRef.current - 10) * 0.6);
        setCameraRot(Math.sin(t2 * 0.8) * amp);
        const tiltAmp = Math.min(12, (scoreRef.current - 10) * 0.4);
        setTiltX(50 + Math.sin(t2 * 0.5) * tiltAmp);
      }

      // Trail (keep last few positions)
      setTrail((prev) => {
        const next = [ballAngleRef.current, ...prev].slice(0, 6);
        return next;
      });

      forceTick((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTap = useCallback(() => {
    const now = performance.now();
    if (now - lastTapRef.current < DEBOUNCE_MS) return;
    lastTapRef.current = now;

    if (statusRef.current === 'idle' || statusRef.current === 'gameover') {
      playClick();
      startGame();
      return;
    }

    const inZone = angleInArc(
      ballAngleRef.current,
      zoneStartRef.current,
      zoneArcRef.current
    );

    if (inZone) {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      playSuccess(newScore);
      setFlash('success');
      setTimeout(() => setFlash(null), 180);
      try { (navigator as any).vibrate?.(15); } catch { }

      // Difficulty ramp — gentle on first 5
      if (newScore > 5) {
        speedRef.current = Math.min(MAX_SPEED, speedRef.current * SPEED_GAIN);
      } else {
        speedRef.current = Math.min(MAX_SPEED, speedRef.current * 1.02);
      }
      if (newScore % SHRINK_EVERY === 0) {
        zoneArcRef.current = Math.max(MIN_ZONE_ARC, zoneArcRef.current * SHRINK_FACTOR);
      }
      // Occasional direction reverse for spice
      if (newScore >= 8 && Math.random() < 0.18) {
        ballDirRef.current *= -1;
      }
      placeZone();
    } else {
      endGame();
    }
  }, [endGame, placeZone, playClick, playSuccess, startGame]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setScore(0);
    scoreRef.current = 0;
    resetEngine();
    setFlash(null);
  }, [resetEngine]);

  // Pre-compute SVG geometry
  const ballX = CENTER + Math.cos(ballAngleRef.current) * RADIUS;
  const ballY = CENTER + Math.sin(ballAngleRef.current) * RADIUS;

  const arcPath = (start: number, arc: number) => {
    const sx = CENTER + Math.cos(start) * RADIUS;
    const sy = CENTER + Math.sin(start) * RADIUS;
    const ex = CENTER + Math.cos(start + arc) * RADIUS;
    const ey = CENTER + Math.sin(start + arc) * RADIUS;
    const large = arc > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${ex} ${ey}`;
  };

  const intense = score >= 20;

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-start relative overflow-hidden select-none ${shake ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}
      style={{ background: backgroundCss, touchAction: 'none' }}
      onPointerDown={handleTap}
    >
      {/* Flash overlay */}
      {flash && (
        <div
          className="absolute inset-0 pointer-events-none z-20 animate-fade-in"
          style={{
            background: flash === 'success'
              ? `radial-gradient(circle at center, ${zoneColor}55, transparent 60%)`
              : `radial-gradient(circle at center, #ff3b3b66, transparent 60%)`,
          }}
        />
      )}

      {/* Top bar */}
      {(status === 'idle' || status === 'gameover') && onBack && (
        <Button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          variant="outline"
          className="absolute top-12 left-4 border-wheel-border hover:bg-button-hover z-30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToMenu}
        </Button>
      )}

      <Button
        onClick={(e) => { e.stopPropagation(); onToggleSound(); }}
        variant="outline"
        size="icon"
        className="absolute top-12 right-4 border-wheel-border hover:bg-button-hover z-30"
      >
        {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* HUD */}
      <div className="text-center mt-20 mb-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-semibold">
          <Sparkles className="w-3 h-3" /> REFLEX 3D · TEST
        </div>
        <div
          className="text-7xl font-extrabold text-primary drop-shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
          style={{ transition: 'transform 120ms', transform: flash === 'success' ? 'scale(1.15)' : 'scale(1)' }}
        >
          {score}
        </div>
        <div className="text-text-secondary text-sm font-semibold">
          {t.bestScore}: {bestScore}
        </div>
      </div>

      {/* 3D arena */}
      <div
        className="relative flex items-center justify-center mt-2"
        style={{ perspective: '900px', perspectiveOrigin: '50% 40%' }}
      >
        <div
          style={{
            transform: `rotateX(${tiltX}deg) rotateZ(${cameraRot}deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 80ms linear',
            willChange: 'transform',
          }}
        >
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            className={isAndroid ? '' : 'drop-shadow-2xl'}
          >
            {/* Outer subtle floor disc for depth */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 22}
              fill="none"
              stroke={barColor}
              strokeOpacity={0.08}
              strokeWidth={2}
            />
            {/* Main ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={barColor}
              strokeOpacity={0.55}
              strokeWidth={10}
              style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 6px ${barColor})` }}
            />
            {/* Decoy red zones */}
            {fakeZonesRef.current.map((d, i) => (
              <path
                key={`decoy-${i}`}
                d={arcPath(d, zoneArcRef.current * 0.85)}
                fill="none"
                stroke="#ff5470"
                strokeOpacity={0.7}
                strokeWidth={14}
                strokeLinecap="round"
                style={{ filter: isAndroid ? 'none' : 'drop-shadow(0 0 8px #ff5470)' }}
              />
            ))}
            {/* Green target zone */}
            <path
              d={arcPath(zoneStartRef.current, zoneArcRef.current)}
              fill="none"
              stroke={zoneColor}
              strokeWidth={intense ? 22 : 18}
              strokeLinecap="round"
              style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 ${intense ? 18 : 12}px ${zoneColor})` }}
            />
            {/* Ball trail */}
            {!isAndroid && trail.map((a, i) => {
              const tx = CENTER + Math.cos(a) * RADIUS;
              const ty = CENTER + Math.sin(a) * RADIUS;
              return (
                <circle
                  key={`tr-${i}`}
                  cx={tx}
                  cy={ty}
                  r={BALL_RADIUS * (1 - i * 0.13)}
                  fill={barColor}
                  opacity={(1 - i / trail.length) * 0.35}
                />
              );
            })}
            {/* Ball */}
            {status === 'running' && (
              <circle
                cx={ballX}
                cy={ballY}
                r={BALL_RADIUS}
                fill={barColor}
                style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 10px ${barColor})` }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* Idle / Gameover overlay */}
      {status === 'idle' && (
        <div className="mt-8 text-center z-10 pointer-events-none">
          <div className="text-2xl font-bold text-primary animate-pulse">🎯 {t.tapOnScreen}</div>
          <p className="text-text-muted text-sm mt-2 px-6">
            Tape n'importe où quand la bille est dans la zone verte.
          </p>
        </div>
      )}

      {status === 'gameover' && (
        <div className="mt-6 flex flex-col items-center gap-3 z-30">
          <div className="px-6 py-3 rounded-full text-white font-bold text-xl bg-gradient-danger shadow-glow-danger animate-scale-in">
            {t.gameOver}
          </div>
          <p className="text-text-secondary text-sm">
            {score >= 20 ? 'Réflexes de pro !' : score >= 10 ? 'Joli timing, continue !' : 'Tu peux faire mieux !'}
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              onClick={(e) => { e.stopPropagation(); handleReset(); startGame(); }}
              className="bg-gradient-primary hover:scale-105 transition-transform"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Rejouer
            </Button>
            {onBack && (
              <Button
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                variant="outline"
                className="border-wheel-border"
              >
                Retour aux modes
              </Button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0,0); }
          20% { transform: translate(-6px, 2px); }
          40% { transform: translate(5px, -3px); }
          60% { transform: translate(-4px, 3px); }
          80% { transform: translate(3px, -2px); }
        }
      `}</style>
    </div>
  );
};
