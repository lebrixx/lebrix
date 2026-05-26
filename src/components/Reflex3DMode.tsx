import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Trail, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles as SparkIcon } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { useLanguage, translations } from '@/hooks/useLanguage';

/**
 * Reflex 3D — real Three.js arena.
 * Self-contained. No leaderboard. No mode registry impact.
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

// ─── Tunables ───
const RING_R = 3;                 // ring radius (world units)
const BALL_R = 0.18;
const BASE_ZONE_ARC = Math.PI / 4;
const MIN_ZONE_ARC = Math.PI / 11;
const BASE_SPEED = 1.5;           // rad/s
const SPEED_GAIN = 1.045;
const MAX_SPEED = 7.5;
const SHRINK_EVERY = 5;
const SHRINK_FACTOR = 0.92;
const TAU = Math.PI * 2;
const DEBOUNCE_MS = 50;
const BEST_KEY = 'bestScore_reflex_3d';

const norm = (a: number) => ((a % TAU) + TAU) % TAU;
const angleInArc = (a: number, start: number, arc: number) => {
  const x = norm(a);
  const s = norm(start);
  const e = norm(start + arc);
  if (s <= e) return x >= s && x <= e;
  return x >= s || x <= e;
};

// ─── Shared engine state via mutable ref bag ───
interface EngineRefs {
  ballAngle: { current: number };
  ballDir: { current: number };
  speed: { current: number };
  zoneArc: { current: number };
  zoneStart: { current: number };
  fakeZones: { current: number[] };
  status: { current: 'idle' | 'running' | 'gameover' };
  score: { current: number };
  flash: { current: 0 | 1 | -1 }; // 0 none, 1 success, -1 failure
  flashTime: { current: number };
}

// ─── 3D Scene ───
const ArenaScene: React.FC<{
  engine: EngineRefs;
  zoneColor: string;
  ballColor: string;
  ringColor: string;
}> = ({ engine, zoneColor, ballColor, ringColor }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const zoneRef = useRef<THREE.Mesh>(null);
  const decoyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cameraOrbitRef = useRef(0);

  const zoneColorObj = useMemo(() => new THREE.Color(zoneColor), [zoneColor]);
  const ballColorObj = useMemo(() => new THREE.Color(ballColor), [ballColor]);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    const e = engine;

    // Update ball position
    if (e.status.current === 'running') {
      e.ballAngle.current = norm(
        e.ballAngle.current + e.ballDir.current * e.speed.current * dt
      );
    }

    // Ball pos (on ring in XZ plane, slight Y bob)
    if (ballRef.current) {
      const a = e.ballAngle.current;
      ballRef.current.position.set(
        Math.cos(a) * RING_R,
        Math.sin(state.clock.elapsedTime * 6) * 0.04,
        Math.sin(a) * RING_R
      );
      // pulse on flash
      const since = state.clock.elapsedTime - e.flashTime.current;
      const pulse = e.flash.current && since < 0.25 ? 1 + (0.25 - since) * 2 : 1;
      ballRef.current.scale.setScalar(pulse);
    }

    // Update green zone geometry transform
    if (zoneRef.current) {
      zoneRef.current.rotation.z = e.zoneStart.current;
      const arc = e.zoneArc.current;
      const geom = zoneRef.current.geometry as THREE.TorusGeometry;
      // Rebuild geometry only if arc changed meaningfully
      const targetArc = arc;
      if (Math.abs((geom.parameters as any).arc - targetArc) > 0.005) {
        geom.dispose();
        zoneRef.current.geometry = new THREE.TorusGeometry(RING_R, 0.22, 16, 64, targetArc);
      }
    }

    // Decoy zones
    decoyRefs.current.forEach((m, i) => {
      if (!m) return;
      const start = e.fakeZones.current[i];
      if (start === undefined) {
        m.visible = false;
        return;
      }
      m.visible = true;
      m.rotation.z = start;
      const geom = m.geometry as THREE.TorusGeometry;
      const arc = e.zoneArc.current * 0.85;
      if (Math.abs((geom.parameters as any).arc - arc) > 0.005) {
        geom.dispose();
        m.geometry = new THREE.TorusGeometry(RING_R, 0.16, 12, 48, arc);
      }
    });

    // Camera orbit (kicks in after score 10)
    if (e.status.current === 'running' && e.score.current >= 10) {
      cameraOrbitRef.current += dt * 0.15;
    }
    const orbit = cameraOrbitRef.current;
    const camRadius = 7.2;
    const camHeight = 4.2;
    state.camera.position.x = Math.sin(orbit) * camRadius;
    state.camera.position.z = Math.cos(orbit) * camRadius;
    state.camera.position.y = camHeight + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    state.camera.lookAt(0, 0, 0);

    // Tilt the arena (oscillates after 15 pts)
    if (groupRef.current) {
      const sc = e.score.current;
      const tilt = sc >= 15 ? Math.sin(state.clock.elapsedTime * 0.5) * Math.min(0.25, (sc - 15) * 0.01) : 0;
      groupRef.current.rotation.x = tilt;
      groupRef.current.rotation.y = sc >= 25 ? Math.sin(state.clock.elapsedTime * 0.4) * 0.1 : 0;
    }

    // Failure camera shake
    if (e.flash.current === -1) {
      const since = state.clock.elapsedTime - e.flashTime.current;
      if (since < 0.35) {
        state.camera.position.x += (Math.random() - 0.5) * 0.25;
        state.camera.position.y += (Math.random() - 0.5) * 0.25;
      }
    }
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 6, 0]} intensity={1.4} color={ringColor} distance={20} />
      <pointLight position={[5, 2, 5]} intensity={0.6} color={zoneColor} distance={15} />
      <pointLight position={[-5, 2, -5]} intensity={0.4} color="#ff5470" distance={15} />

      {/* Background stars */}
      <Stars radius={60} depth={40} count={1200} factor={3} fade speed={0.5} />

      {/* Floor disc for depth perception */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <ringGeometry args={[RING_R - 0.5, RING_R + 1.2, 64]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Arena group — tilted for 3D feel */}
      <group ref={groupRef} rotation={[0, 0, 0]}>
        {/* Inner glow disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RING_R - 0.3, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.04} />
        </mesh>

        {/* Main ring (torus laid flat, axis = Y) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_R, 0.06, 24, 128]} />
          <meshStandardMaterial
            color={ringColor}
            emissive={ringColor}
            emissiveIntensity={0.8}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Secondary outer ring for visual richness */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_R + 0.35, 0.015, 12, 96]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.4} />
        </mesh>

        {/* Green target zone — torus arc, laid flat */}
        <mesh ref={zoneRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING_R, 0.22, 16, 64, BASE_ZONE_ARC]} />
          <meshStandardMaterial
            color={zoneColor}
            emissive={zoneColor}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>

        {/* Decoy red zones (up to 2) */}
        {[0, 1].map((i) => (
          <mesh
            key={i}
            ref={(el) => (decoyRefs.current[i] = el)}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <torusGeometry args={[RING_R, 0.16, 12, 48, BASE_ZONE_ARC * 0.85]} />
            <meshStandardMaterial
              color="#ff5470"
              emissive="#ff2255"
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Sparkles inside arena */}
        <Sparkles count={40} scale={[RING_R * 2.5, 1.2, RING_R * 2.5]} size={2} speed={0.3} color={ringColor} opacity={0.5} />

        {/* Ball with trail */}
        <Trail
          width={0.6}
          length={5}
          color={new THREE.Color(ballColor)}
          attenuation={(t) => t * t}
        >
          <mesh ref={ballRef}>
            <sphereGeometry args={[BALL_R, 24, 24]} />
            <meshStandardMaterial
              color={ballColor}
              emissive={ballColor}
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </Trail>
      </group>
    </group>
  );
};

// ─── Main component ───
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
  const ballColor = themeDef.preview.circle;
  const ringColor = themeDef.preview.circle;
  const backgroundCss = themeDef.preview.background;

  const [status, setStatus] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('luckyStopGame');
      if (!saved) return 0;
      return JSON.parse(saved)[BEST_KEY] || 0;
    } catch { return 0; }
  });
  const [flashOverlay, setFlashOverlay] = useState<'success' | 'failure' | null>(null);

  // Engine refs — shared with the scene
  const engine: EngineRefs = useMemo(() => ({
    ballAngle: { current: -Math.PI / 2 },
    ballDir: { current: 1 },
    speed: { current: BASE_SPEED },
    zoneArc: { current: BASE_ZONE_ARC },
    zoneStart: { current: 0 },
    fakeZones: { current: [] },
    status: { current: 'idle' },
    score: { current: 0 },
    flash: { current: 0 },
    flashTime: { current: 0 },
  }), []);

  const lastTapRef = useRef(0);

  useEffect(() => { engine.status.current = status; }, [status, engine]);
  useEffect(() => { engine.score.current = score; }, [score, engine]);

  const placeZone = useCallback(() => {
    let s: number;
    let tries = 0;
    do {
      s = Math.random() * TAU;
      tries++;
    } while (
      tries < 10 &&
      Math.abs(norm(s + engine.zoneArc.current / 2 - engine.ballAngle.current)) < engine.zoneArc.current
    );
    engine.zoneStart.current = s;

    if (engine.score.current >= 20) {
      const decoys: number[] = [];
      const count = engine.score.current >= 35 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        let d: number;
        let t2 = 0;
        do {
          d = Math.random() * TAU;
          t2++;
        } while (t2 < 10 && Math.abs(norm(d - s)) < engine.zoneArc.current * 1.5);
        decoys.push(d);
      }
      engine.fakeZones.current = decoys;
    } else {
      engine.fakeZones.current = [];
    }
  }, [engine]);

  const resetEngine = useCallback(() => {
    engine.ballAngle.current = -Math.PI / 2;
    engine.ballDir.current = Math.random() < 0.5 ? 1 : -1;
    engine.speed.current = BASE_SPEED;
    engine.zoneArc.current = BASE_ZONE_ARC;
    engine.fakeZones.current = [];
    placeZone();
  }, [engine, placeZone]);

  const startGame = useCallback(() => {
    setScore(0);
    engine.score.current = 0;
    resetEngine();
    setStatus('running');
    setFlashOverlay(null);
  }, [engine, resetEngine]);

  const endGame = useCallback(() => {
    setStatus('gameover');
    playFailure();
    setFlashOverlay('failure');
    engine.flash.current = -1;
    engine.flashTime.current = performance.now() / 1000;
    setTimeout(() => setFlashOverlay(null), 600);
    setBestScore((prev) => {
      const next = Math.max(prev, engine.score.current);
      try {
        const data = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
        data[BEST_KEY] = next;
        localStorage.setItem('luckyStopGame', JSON.stringify(data));
      } catch {}
      return next;
    });
    try { (navigator as any).vibrate?.(80); } catch {}
  }, [engine, playFailure]);

  const handleTap = useCallback(() => {
    const now = performance.now();
    if (now - lastTapRef.current < DEBOUNCE_MS) return;
    lastTapRef.current = now;

    if (status === 'idle' || status === 'gameover') {
      playClick();
      startGame();
      return;
    }

    const inZone = angleInArc(
      engine.ballAngle.current,
      engine.zoneStart.current,
      engine.zoneArc.current
    );

    if (inZone) {
      const newScore = engine.score.current + 1;
      engine.score.current = newScore;
      setScore(newScore);
      playSuccess(newScore);
      setFlashOverlay('success');
      engine.flash.current = 1;
      engine.flashTime.current = now / 1000;
      setTimeout(() => setFlashOverlay(null), 160);
      try { (navigator as any).vibrate?.(15); } catch {}

      if (newScore > 5) {
        engine.speed.current = Math.min(MAX_SPEED, engine.speed.current * SPEED_GAIN);
      } else {
        engine.speed.current = Math.min(MAX_SPEED, engine.speed.current * 1.02);
      }
      if (newScore % SHRINK_EVERY === 0) {
        engine.zoneArc.current = Math.max(MIN_ZONE_ARC, engine.zoneArc.current * SHRINK_FACTOR);
      }
      if (newScore >= 8 && Math.random() < 0.18) {
        engine.ballDir.current *= -1;
      }
      placeZone();
    } else {
      endGame();
    }
  }, [engine, endGame, placeZone, playClick, playSuccess, startGame, status]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setScore(0);
    engine.score.current = 0;
    engine.flash.current = 0;
    resetEngine();
    setFlashOverlay(null);
  }, [engine, resetEngine]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-hidden select-none"
      style={{ background: backgroundCss, touchAction: 'none' }}
      onPointerDown={handleTap}
    >
      {/* Canvas fills behind UI */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 4.2, 7.2], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <ArenaScene
              engine={engine}
              zoneColor={zoneColor}
              ballColor={ballColor}
              ringColor={ringColor}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient vignette for depth */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Flash overlay */}
      {flashOverlay && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: flashOverlay === 'success'
              ? `radial-gradient(circle at center, ${zoneColor}66, transparent 65%)`
              : `radial-gradient(circle at center, #ff224488, transparent 70%)`,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Top bar */}
      {(status === 'idle' || status === 'gameover') && onBack && (
        <Button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          variant="outline"
          className="absolute top-12 left-4 border-wheel-border bg-black/30 backdrop-blur-sm hover:bg-button-hover z-30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToMenu}
        </Button>
      )}

      <Button
        onClick={(e) => { e.stopPropagation(); onToggleSound(); }}
        variant="outline"
        size="icon"
        className="absolute top-12 right-4 border-wheel-border bg-black/30 backdrop-blur-sm hover:bg-button-hover z-30"
      >
        {isSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* HUD */}
      <div className="relative z-10 text-center mt-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/50 backdrop-blur-sm text-primary text-xs font-bold tracking-wider">
          <SparkIcon className="w-3 h-3" /> REFLEX 3D · TEST
        </div>
        <div
          className="text-7xl font-extrabold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
          style={{
            transition: 'transform 120ms ease-out',
            transform: flashOverlay === 'success' ? 'scale(1.18)' : 'scale(1)',
            textShadow: `0 0 30px ${ballColor}, 0 0 60px ${ballColor}80`,
          }}
        >
          {score}
        </div>
        <div className="text-white/70 text-sm font-semibold mt-1">
          {t.bestScore}: {bestScore}
        </div>
      </div>

      {/* Idle */}
      {status === 'idle' && (
        <div className="relative z-10 mt-auto mb-32 text-center pointer-events-none animate-fade-in">
          <div className="text-2xl font-bold text-white animate-pulse drop-shadow-lg">
            🎯 {t.tapOnScreen}
          </div>
          <p className="text-white/70 text-sm mt-2 px-6 max-w-xs mx-auto">
            Tape n'importe où quand la bille traverse la zone verte.
          </p>
        </div>
      )}

      {/* Gameover */}
      {status === 'gameover' && (
        <div className="relative z-30 mt-auto mb-24 flex flex-col items-center gap-3 animate-fade-in">
          <div className="px-6 py-3 rounded-full text-white font-bold text-xl bg-gradient-danger shadow-glow-danger animate-scale-in">
            {t.gameOver}
          </div>
          <p className="text-white/80 text-sm font-medium">
            {score >= 25 ? '🔥 Réflexes de pro !' : score >= 12 ? '👏 Joli timing, continue !' : '💪 Tu peux faire mieux !'}
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              onClick={(e) => { e.stopPropagation(); handleReset(); startGame(); }}
              className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow-primary"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Rejouer
            </Button>
            {onBack && (
              <Button
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                variant="outline"
                className="border-wheel-border bg-black/30 backdrop-blur-sm"
              >
                Retour aux modes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
