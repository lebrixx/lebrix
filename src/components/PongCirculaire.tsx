import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { Capacitor } from '@capacitor/core';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { startGameSession } from '@/utils/scoresApi';

interface PongCirculaireProps {
  theme: string;
  onBack?: () => void;
  onGameOver?: (score: number, gameDuration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playClick?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
}

const RADIUS = 130;
const PADDING = 40;
const SVG_SIZE = RADIUS * 2 + PADDING * 2;
const CENTER = RADIUS + PADDING;
const BALL_RADIUS = 8;
const ZONE_ARC = Math.PI / 4; // ~45°
const BASE_SPEED = 110; // px/s
const SPEED_GAIN = 1.035; // +3.5% par renvoi
const MAX_SPEED = 700;

// Distance d'impact (centre cercle → centre bille) à laquelle on teste la collision
const IMPACT_DIST = RADIUS - BALL_RADIUS;

const TAU = Math.PI * 2;

function angleInArc(angle: number, start: number, arc: number): boolean {
  const norm = (a: number) => ((a % TAU) + TAU) % TAU;
  const a = norm(angle);
  const s = norm(start);
  const e = norm(start + arc);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
}

export const PongCirculaire: React.FC<PongCirculaireProps> = ({
  theme,
  onBack,
  onGameOver,
  isSoundMuted = false,
  onToggleSound = () => {},
  playClick = () => {},
  playSuccess = () => {},
  playFailure = () => {},
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const themeDef = THEMES.find((th) => th.id === theme) || THEMES[0];
  const zoneColor = themeDef.preview.successZone;
  const barColor = themeDef.preview.circle;
  const backgroundCss = themeDef.preview.background;
  const isAndroid = useMemo(() => Capacitor.getPlatform() === 'android', []);

  const [status, setStatus] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem('luckyStopGame');
    if (!saved) return 0;
    try { return JSON.parse(saved).bestScore_pong_circulaire || 0; } catch { return 0; }
  });

  // Refs pour le moteur
  const ballPos = useRef({ x: 0, y: 0 }); // relatif au centre
  const ballVel = useRef({ x: 0, y: 0 });
  const speedRef = useRef(BASE_SPEED);
  const zoneCenterRef = useRef(-Math.PI / 2); // angle (top par défaut)
  const lastFrameRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const startTimeRef = useRef(0);
  const scoreRef = useRef(0);

  // État dérivé pour le rendu
  const [, forceTick] = useState(0);

  const startGame = useCallback(() => {
    playClick();
    // Position initiale: centre, direction aléatoire
    ballPos.current = { x: 0, y: 0 };
    const angle = Math.random() * TAU;
    speedRef.current = BASE_SPEED;
    ballVel.current = {
      x: Math.cos(angle) * BASE_SPEED,
      y: Math.sin(angle) * BASE_SPEED,
    };
    zoneCenterRef.current = -Math.PI / 2;
    setScore(0);
    scoreRef.current = 0;
    startTimeRef.current = Date.now();
    startGameSession();
    setStatus('running');
  }, [playClick]);

  const handleGameOver = useCallback(() => {
    playFailure();
    cancelAnimationFrame(rafRef.current);
    const finalScore = scoreRef.current;
    const duration = (Date.now() - startTimeRef.current) / 1000;
    // Sauvegarder best
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      try {
        const saved = localStorage.getItem('luckyStopGame');
        const data = saved ? JSON.parse(saved) : {};
        data.bestScore_pong_circulaire = finalScore;
        localStorage.setItem('luckyStopGame', JSON.stringify(data));
      } catch {}
    }
    setStatus('gameover');
    onGameOver?.(finalScore, duration);
  }, [bestScore, onGameOver, playFailure]);

  // Boucle animation
  useEffect(() => {
    if (status !== 'running') return;
    lastFrameRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.033);
      lastFrameRef.current = now;

      // Avancer la bille
      ballPos.current.x += ballVel.current.x * dt;
      ballPos.current.y += ballVel.current.y * dt;

      const dist = Math.hypot(ballPos.current.x, ballPos.current.y);

      if (dist >= IMPACT_DIST) {
        const impactAngle = Math.atan2(ballPos.current.y, ballPos.current.x);
        const nx = Math.cos(impactAngle);
        const ny = Math.sin(impactAngle);
        const vx = ballVel.current.x;
        const vy = ballVel.current.y;
        const dot = vx * nx + vy * ny;

        // Anti double-collision: si la bille va déjà vers l'intérieur, ne rien faire
        if (dot <= 0) {
          const safeDist = IMPACT_DIST - 2;
          ballPos.current.x = nx * safeDist;
          ballPos.current.y = ny * safeDist;
        } else {
          const halfArc = ZONE_ARC / 2;
          const start = zoneCenterRef.current - halfArc;
          const inZone = angleInArc(impactAngle, start, ZONE_ARC);

          if (inZone) {
            let rx = vx - 2 * dot * nx;
            let ry = vy - 2 * dot * ny;
            speedRef.current = Math.min(speedRef.current * SPEED_GAIN, MAX_SPEED);
            const mag = Math.hypot(rx, ry) || 1;
            rx = (rx / mag) * speedRef.current;
            ry = (ry / mag) * speedRef.current;
            ballVel.current = { x: rx, y: ry };
            const safeDist = IMPACT_DIST - 3;
            ballPos.current.x = nx * safeDist;
            ballPos.current.y = ny * safeDist;
            scoreRef.current += 1;
            setScore(scoreRef.current);
            playSuccess(scoreRef.current);
          } else {
            handleGameOver();
            return;
          }
        }
      }

      forceTick((v) => (v + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, handleGameOver, playSuccess]);

  // Gestion tactile : déplacer la zone verte
  const updateZoneFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    // Coordonnées dans le svg
    const sx = ((clientX - rect.left) / rect.width) * SVG_SIZE;
    const sy = ((clientY - rect.top) / rect.height) * SVG_SIZE;
    const dx = sx - CENTER;
    const dy = sy - CENTER;
    if (dx === 0 && dy === 0) return;
    zoneCenterRef.current = Math.atan2(dy, dx);
    forceTick((v) => (v + 1) % 1000000);
  }, []);

  const onPointerMove = (e: React.PointerEvent) => {
    if (status !== 'running') return;
    updateZoneFromPointer(e.clientX, e.clientY);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (status !== 'running') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateZoneFromPointer(e.clientX, e.clientY);
  };

  // Calcul rendu
  const ballRenderX = CENTER + ballPos.current.x;
  const ballRenderY = CENTER + ballPos.current.y;
  const halfArc = ZONE_ARC / 2;
  const startAngle = zoneCenterRef.current - halfArc;
  const endAngle = zoneCenterRef.current + halfArc;
  const sx = CENTER + Math.cos(startAngle) * RADIUS;
  const sy = CENTER + Math.sin(startAngle) * RADIUS;
  const ex = CENTER + Math.cos(endAngle) * RADIUS;
  const ey = CENTER + Math.sin(endAngle) * RADIUS;
  const largeArc = ZONE_ARC > Math.PI ? 1 : 0;

  const handleScreenTap = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.closest('a')) return;
    if (status === 'idle' || status === 'gameover') {
      playClick();
      startGame();
    }
  };

  const handleReset = () => {
    playClick();
    cancelAnimationFrame(rafRef.current);
    setStatus('idle');
    setScore(0);
    scoreRef.current = 0;
  };

  const handleBoostsInfo = () => {
    playClick();
    toast({
      title: 'Boosts indisponibles',
      description: 'Les boosts ne sont pas utilisables dans ce mode.',
      duration: 2000,
    });
  };

  return (
    <div
      className={`circle-tap-game min-h-screen flex flex-col items-center justify-center p-4 ${theme}`}
      style={{ background: backgroundCss, cursor: status === 'running' ? 'pointer' : 'default' }}
      onClick={handleScreenTap}
    >
      {/* Bouton retour au menu */}
      {(status === 'idle' || status === 'gameover') && onBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="absolute top-12 left-4 border-wheel-border hover:bg-button-hover z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToMenu}
        </Button>
      )}

      {/* HUD */}
      <div className="text-center mb-8 animate-fade-in mt-16">
        <div className="text-6xl font-bold text-primary mb-2 drop-shadow-lg">{score}</div>
        <div className="text-text-secondary text-lg font-semibold">
          {t.bestScore}: {bestScore}
        </div>
      </div>

      {/* Cercle de jeu */}
      <div className="game-circle relative mb-8 select-none touch-none">
        <svg
          ref={svgRef}
          width={SVG_SIZE}
          height={SVG_SIZE}
          className={`${isAndroid ? '' : 'drop-shadow-2xl'} max-w-full h-auto touch-none`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          style={{ touchAction: 'none' }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={barColor}
            strokeWidth={12}
            className="opacity-90"
            style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 5px ${barColor})` }}
          />
          <path
            d={`M ${sx} ${sy} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${ex} ${ey}`}
            fill="none"
            stroke={zoneColor}
            strokeWidth={20}
            strokeLinecap="round"
            style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 15px ${zoneColor})` }}
          />
          {status === 'running' && (
            <circle
              cx={ballRenderX}
              cy={ballRenderY}
              r={BALL_RADIUS}
              fill={barColor}
              style={{ filter: isAndroid ? 'none' : `drop-shadow(0 0 8px ${barColor})` }}
            />
          )}
        </svg>

        {status === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="px-6 py-3 rounded-full text-white font-bold text-xl animate-scale-in bg-gradient-danger shadow-glow-danger">
              {t.gameOver}
            </div>
          </div>
        )}
      </div>

      {/* Contrôles - identiques aux autres modes */}
      <div className="flex gap-4 items-center animate-fade-in">
        {(status === 'idle' || status === 'gameover') && (
          <div className="text-center w-full">
            <div className="flex flex-col gap-3 mb-3">
              <Button
                onClick={handleBoostsInfo}
                variant="outline"
                className="relative border-primary/40 bg-primary/5 hover:bg-primary/15 hover:border-primary/60 hover:scale-105 transition-all duration-300 shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
              >
                <span className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
                <Zap className="w-5 h-5 mr-2 text-primary" />
                {t.boosts}
              </Button>
            </div>
            <div
              className="text-2xl font-bold text-primary mb-2 cursor-pointer select-none animate-pulse"
              onClick={(e) => { e.stopPropagation(); playClick(); startGame(); }}
            >
              🎯 {t.tapOnScreen}
            </div>
          </div>
        )}

        <Button
          onClick={(e) => { e.stopPropagation(); handleReset(); }}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <Button
          onClick={(e) => { e.stopPropagation(); onToggleSound(); }}
          variant="outline"
          size="lg"
          className="border-wheel-border hover:bg-button-hover hover:scale-105 transition-all duration-300"
        >
          {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-center mt-8 text-text-muted animate-fade-in">
        <p className="text-sm">
          {status === 'running'
            ? 'Glisse ton doigt autour du cercle pour renvoyer la bille !'
            : status === 'idle'
              ? t.tapToStartGame
              : ''}
        </p>
      </div>
    </div>
  );
};
