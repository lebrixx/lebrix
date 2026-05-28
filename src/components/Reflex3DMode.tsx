import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles as SparkIcon } from 'lucide-react';
import { THEMES } from '@/constants/themes';
import { useLanguage, translations } from '@/hooks/useLanguage';

/**
 * Reflex 3D — Three.js arena (stable build).
 * Arena lives in the XY plane, tilted by a parent group for a 3D feel.
 * Camera is fixed: no orbit, no off-screen drift.
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

const RING_R = 1.9;
const TUBE_R = 0.28;
const BALL_R = 0.17;
const CAMERA_FOV = 50;
const BASE_ZONE_ARC = Math.PI / 4;


const MIN_ZONE_ARC = Math.PI / 11;
const BASE_SPEED = 1.5;
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

const pointerHitsZone = (event: React.PointerEvent<HTMLDivElement>, start: number, arc: number) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx;
  const dy = cy - event.clientY;
  const dist = Math.hypot(dx, dy);
  const shortSide = Math.min(rect.width, rect.height);

  if (dist < shortSide * 0.18 || dist > shortSide * 0.46) return false;
  return angleInArc(Math.atan2(dy, dx), start - 0.08, arc + 0.16);
};

const getTorusArc = (geometry: THREE.BufferGeometry) => {
  return (geometry as THREE.TorusGeometry).parameters.arc;
};

interface EngineRefs {
  ballAngle: { current: number };
  ballDir: { current: number };
  speed: { current: number };
  zoneArc: { current: number };
  zoneStart: { current: number };
  fakeZones: { current: number[] };
  status: { current: 'idle' | 'running' | 'gameover' };
  score: { current: number };
  flash: { current: 0 | 1 | -1 };
  flashTime: { current: number };
}

const ResponsiveCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(0.1, size.width / Math.max(1, size.height));
    const visibleRadius = RING_R + 0.55;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const margin = 1.22;
    const distanceForHeight = (visibleRadius * margin) / Math.tan(fov / 2);
    const distanceForWidth = (visibleRadius * margin) / (Math.tan(fov / 2) * aspect);

    camera.position.set(0, 0, Math.max(7.2, distanceForHeight, distanceForWidth));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  return null;
};

const ArenaScene: React.FC<{
  engine: EngineRefs;
  zoneColor: string;
  ballColor: string;
  ringColor: string;
}> = ({ engine, zoneColor, ballColor, ringColor }) => {
  const tiltRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const zoneGroupRef = useRef<THREE.Group>(null);
  const zoneMeshRef = useRef<THREE.Mesh>(null);
  const decoyGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const decoyMeshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    const e = engine;
    const t = state.clock.elapsedTime;
    const nowSec = performance.now() / 1000; // same epoch as engine.flashTime

    // Update ball angle
    if (e.status.current === 'running') {
      e.ballAngle.current = norm(
        e.ballAngle.current + e.ballDir.current * e.speed.current * dt
      );
    }

    // Ball position in XY plane (arena plane)
    if (ballRef.current) {
      const a = e.ballAngle.current;
      const x = Math.cos(a) * RING_R;
      const y = Math.sin(a) * RING_R;
      ballRef.current.position.set(x, y, 0.05);

      const since = nowSec - e.flashTime.current;
      let pulse = 1;
      if (e.flash.current === 1 && since >= 0 && since < 0.25) {
        pulse = 1 + (0.25 - since) * 1.2; // max 1.3, clamped
      }
      pulse = Math.min(1.4, Math.max(0.85, pulse));
      ballRef.current.scale.setScalar(pulse);
    }

    // Zone rotation (around Z = around arena normal)
    if (zoneGroupRef.current) {
      zoneGroupRef.current.rotation.z = e.zoneStart.current;
    }
    if (zoneMeshRef.current) {
      const geom = zoneMeshRef.current.geometry as THREE.TorusGeometry;
      const arc = e.zoneArc.current;
      if (Math.abs(getTorusArc(geom) - arc) > 0.005) {
        geom.dispose();
        zoneMeshRef.current.geometry = new THREE.TorusGeometry(RING_R, 0.18, 16, 64, arc);
      }
    }

    // Decoys
    decoyGroupRefs.current.forEach((g, i) => {
      const start = e.fakeZones.current[i];
      if (!g) return;
      if (start === undefined) {
        g.visible = false;
        return;
      }
      g.visible = true;
      g.rotation.z = start;
      const m = decoyMeshRefs.current[i];
      if (m) {
        const geom = m.geometry as THREE.TorusGeometry;
        const arc = e.zoneArc.current * 0.85;
        if (Math.abs(getTorusArc(geom) - arc) > 0.005) {
          geom.dispose();
          m.geometry = new THREE.TorusGeometry(RING_R, 0.14, 12, 48, arc);
        }
      }
    });

    // Arena tilt + slow self-rotation for true 3D feel & added difficulty.
    if (tiltRef.current) {
      const breathe = Math.sin(t * 0.7) * 0.05;
      tiltRef.current.rotation.x = -0.55 + breathe;
      // Continuous slow yaw drift + sway → ball visually shifts, harder timing
      tiltRef.current.rotation.y = t * 0.18 + Math.sin(t * 0.6) * 0.18;
      tiltRef.current.rotation.z = Math.sin(t * 0.4) * 0.06;
    }


    // Failure shake on group, not camera (keeps things on-screen)
    if (e.flash.current === -1 && tiltRef.current) {
      const since = nowSec - e.flashTime.current;
      if (since >= 0 && since < 0.35) {
        tiltRef.current.position.x = (Math.random() - 0.5) * 0.15;
        tiltRef.current.position.y = (Math.random() - 0.5) * 0.15;
      } else {
        tiltRef.current.position.set(0, 0, 0);
      }
    }
  });
  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#ffffff" />
      <pointLight position={[0, 3, 4]} intensity={1.0} color={ringColor} distance={20} />
      <pointLight position={[-3, -2, 3]} intensity={0.5} color={zoneColor} distance={15} />

      {/* Star backdrop */}
      <Stars radius={50} depth={28} count={500} factor={2} fade speed={0.2} />

      {/* Grid floor (cyber-grid backdrop) */}
      <gridHelper
        args={[40, 40, ringColor, ringColor]}
        position={[0, -2.6, -1.2]}
        rotation={[Math.PI / 2.4, 0, 0]}
      >
        <meshBasicMaterial attach="material" color={ringColor} transparent opacity={0.22} />
      </gridHelper>
      <gridHelper
        args={[40, 20, ringColor, ringColor]}
        position={[0, 2.6, -1.2]}
        rotation={[-Math.PI / 2.4, 0, 0]}
      >
        <meshBasicMaterial attach="material" color={ringColor} transparent opacity={0.12} />
      </gridHelper>

      <group ref={tiltRef}>
        {/* Soft back glow halo */}
        <mesh position={[0, 0, -0.5]}>
          <circleGeometry args={[RING_R + 1.1, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0.08} />
        </mesh>

        {/* Solid 3D tube — metallic, no glass */}
        <mesh>
          <torusGeometry args={[RING_R, TUBE_R, 32, 200]} />
          <meshStandardMaterial
            color={ringColor}
            emissive={ringColor}
            emissiveIntensity={0.35}
            metalness={0.85}
            roughness={0.28}
          />
        </mesh>

        {/* Target zone — solid emissive segment on top of tube */}
        <group ref={zoneGroupRef}>
          <mesh ref={zoneMeshRef}>
            <torusGeometry args={[RING_R, TUBE_R * 1.02, 24, 96, BASE_ZONE_ARC]} />
            <meshStandardMaterial
              color={zoneColor}
              emissive={zoneColor}
              emissiveIntensity={2.2}
              metalness={0.3}
              roughness={0.35}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Decoys */}
        {[0, 1].map((i) => (
          <group key={i} ref={(el) => (decoyGroupRefs.current[i] = el)} visible={false}>
            <mesh ref={(el) => (decoyMeshRefs.current[i] = el)}>
              <torusGeometry args={[RING_R, TUBE_R * 1.02, 20, 72, BASE_ZONE_ARC * 0.85]} />
              <meshStandardMaterial
                color="#ff5470"
                emissive="#ff2255"
                emissiveIntensity={1.6}
                metalness={0.3}
                roughness={0.35}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Ball — bright emissive sphere riding the tube */}
        <mesh ref={ballRef}>
          <sphereGeometry args={[BALL_R, 32, 32]} />
          <meshStandardMaterial
            color={ballColor}
            emissive={ballColor}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>

        <Sparkles count={16} scale={[RING_R * 2.4, RING_R * 2.4, 1]} size={1.3} speed={0.2} color={ringColor} opacity={0.35} />
      </group>
    </group>
  );
};

      </group>
    </group>
  );
};

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
      } catch {
        return next;
      }
      return next;
    });
    navigator.vibrate?.(80);
  }, [engine, playFailure]);

  const handleTap = useCallback((forceSuccess = false) => {
    const now = performance.now();
    if (now - lastTapRef.current < DEBOUNCE_MS) return;
    lastTapRef.current = now;

    if (status === 'idle' || status === 'gameover') {
      playClick();
      startGame();
      return;
    }

    const inZone = forceSuccess || angleInArc(
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
      navigator.vibrate?.(15);

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

  const handleArenaPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const clickedGreenZone = status === 'running' && pointerHitsZone(
      event,
      engine.zoneStart.current,
      engine.zoneArc.current
    );
    handleTap(clickedGreenZone);
  }, [engine, handleTap, status]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setScore(0);
    engine.score.current = 0;
    engine.status.current = 'idle';
    engine.flash.current = 0;
    engine.flashTime.current = 0;
    lastTapRef.current = 0;
    resetEngine();
    setFlashOverlay(null);
  }, [engine, resetEngine]);

  const replayGame = useCallback(() => {
    lastTapRef.current = 0;
    setScore(0);
    engine.score.current = 0;
    engine.status.current = 'running';
    engine.flash.current = 0;
    engine.flashTime.current = 0;
    resetEngine();
    setFlashOverlay(null);
    setStatus('running');
    playClick();
  }, [engine, playClick, resetEngine]);

  return (
    <div
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-start overflow-hidden select-none"
      style={{ background: backgroundCss, touchAction: 'none' }}
    >
      <div className="absolute inset-0 z-0" onPointerDown={handleArenaPointerDown}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: CAMERA_FOV }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <ResponsiveCamera />
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

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)',
        }}
      />

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

      {status === 'idle' && (
        <div className="absolute bottom-24 left-0 right-0 z-10 text-center pointer-events-none animate-fade-in">
          <div className="text-2xl font-bold text-white animate-pulse drop-shadow-lg">
            🎯 {t.tapOnScreen}
          </div>
          <p className="text-white/70 text-sm mt-2 px-6 max-w-xs mx-auto">
            Tape n'importe où quand la bille traverse la zone verte.
          </p>
        </div>
      )}

      {status === 'gameover' && (
        <div className="absolute bottom-16 left-0 right-0 z-30 flex flex-col items-center gap-3 animate-fade-in px-4">
          <div className="px-6 py-3 rounded-full text-white font-bold text-xl bg-gradient-danger shadow-glow-danger animate-scale-in">
            {t.gameOver}
          </div>
          <p className="text-white/80 text-sm font-medium">
            {score >= 25 ? '🔥 Réflexes de pro !' : score >= 12 ? '👏 Joli timing, continue !' : '💪 Tu peux faire mieux !'}
          </p>
          <div className="flex gap-3 mt-2">
            <Button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); replayGame(); }}
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
                Retour
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
