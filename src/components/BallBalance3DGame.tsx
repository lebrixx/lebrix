import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, Sparkles } from 'lucide-react';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { BoostType } from '@/types/boosts';
import { useLanguage, translations } from '@/hooks/useLanguage';

/**
 * Ball Balance 3D — implementation fidèle au cahier des charges fourni.
 * Mode jouable à la place de l'ancien "Arc changeant".
 * Score = secondes écoulées (entier).
 */

interface BallBalance3DGameProps {
  onBack?: () => void;
  onGameOver?: (score: number, gameDuration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
}

// ===== Constantes =====
const TRACK_HW = 0.28;
const BALL_Z = 3;
const TOL = 0.32;
const INVULN = 2.0;
const CENTER_LOCK = 0.6;
const STRAIGHT_LEN = 7;
const RAMP_LEN = 4;
const MAX_OFFSET = 1.4;
const SEG = 9;
const N_SEG = 240;
const STEP = 0.45;
const BEHIND = 6;
const BEST_KEY = 'bestScore_arc_changeant';

// ===== Utils =====
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const curve = (d: number): number => {
  if (d < STRAIGHT_LEN) return 0;
  const t = Math.min(1, (d - STRAIGHT_LEN) / RAMP_LEN);
  const dd = d - STRAIGHT_LEN;
  const raw =
    Math.sin(dd * 0.18) * 1.0 +
    Math.sin(dd * 0.07 + 1.7) * 0.6 +
    Math.sin(dd * 0.32 + 0.4) * 0.25;
  return clamp(raw * t, -MAX_OFFSET, MAX_OFFSET);
};

interface PlateInfo {
  y: number;
  baseX: number;
}

const plateInfo = (d: number): PlateInfo => {
  const baseX = curve(d);
  if (d < STRAIGHT_LEN + 1) return { y: 0, baseX };
  const segId = Math.floor((d - STRAIGHT_LEN) / SEG);
  const localT = ((d - STRAIGHT_LEN) - segId * SEG) / SEG;
  const r = hash(segId + 1);
  if (r >= 0.55) return { y: 0, baseX };
  const env = 0.5 - 0.5 * Math.cos(localT * Math.PI * 2);
  const seed = hash(segId * 2.7 + 13.1);
  const dir = seed < 0.28 ? -1 : 1;
  return { y: env * 0.7 * dir, baseX };
};

// ===== Pointer tracking =====
function usePointerTrack() {
  const pointer = useRef({ x: 0, y: 0, active: false });
  const elRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    pointer.current.x = x;
    pointer.current.y = y;
  }, []);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      pointer.current.active = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      update(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (pointer.current.active || e.pointerType === 'mouse') update(e);
    },
    onPointerUp: () => { pointer.current.active = false; },
    onPointerCancel: () => { pointer.current.active = false; },
  };

  return { pointer, handlers, elRef };
}

// ===== Caméra responsive =====
const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const baseVFov = 60;
    const minHFov = (78 * Math.PI) / 180;
    const aspect = Math.max(size.width / size.height, 0.0001);
    const requiredVFov = 2 * Math.atan(Math.tan(minHFov / 2) / aspect);
    const vfovRad = Math.max((baseVFov * Math.PI) / 180, requiredVFov);
    const vfovDeg = Math.min((vfovRad * 180) / Math.PI, 95);
    cam.fov = vfovDeg;
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
};

// ===== Décor =====
const BackgroundDecor: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const orbsGroupRef = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = -2 + Math.random() * 18;
      positions[i * 3 + 2] = -55 + Math.random() * 50;
    }
    return positions;
  }, []);

  const orbs = useMemo(() => {
    const arr: { pos: [number, number, number]; r: number; color: string }[] = [];
    const colors = ['#7c3aed', '#22d3ee', '#ec4899'];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const rad = 14 + Math.random() * 6;
      arr.push({
        pos: [Math.cos(a) * rad, 2 + Math.random() * 6, -32 + Math.random() * 14],
        r: 1.4 + Math.random() * 1.4,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const pts = particlesRef.current;
    if (pts) {
      const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += 0.25 * dt;
        if (arr[i + 1] > 14) arr[i + 1] = -4;
      }
      pos.needsUpdate = true;
    }
    if (orbsGroupRef.current) orbsGroupRef.current.rotation.y += 0.05 * dt;
  });

  return (
    <group>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} count={particles.length / 3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#22d3ee" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <group ref={orbsGroupRef}>
        {orbs.map((o, i) => (
          <mesh key={i} position={o.pos}>
            <sphereGeometry args={[o.r, 16, 12]} />
            <meshBasicMaterial color={o.color} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <gridHelper args={[80, 40, '#7c3aed', '#1a0f33']} position={[0, -3, -30]} />
    </group>
  );
};

// ===== Scène jeu =====
interface SceneProps {
  pointer: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  onScore: (s: number) => void;
  onDie: (s: number) => void;
  playing: boolean;
}

const RIBBONS = [
  { leftB: -0.28, rightB: 0.28, color: 0x4c1d95, emissive: 0x7c3aed, intensity: 0.55, yOff: 0 },
  { leftB: -0.32, rightB: -0.26, color: 0x22d3ee, emissive: 0x22d3ee, intensity: 1.1, yOff: 0.04 },
  { leftB: 0.26, rightB: 0.32, color: 0x22d3ee, emissive: 0x22d3ee, intensity: 1.1, yOff: 0.04 },
];

const GameScene: React.FC<SceneProps> = ({ pointer, onScore, onDie, playing }) => {
  const { camera } = useThree();
  const ballRef = useRef<THREE.Mesh>(null);
  const ribbonRefs = useRef<(THREE.BufferGeometry | null)[]>([null, null, null]);

  const state = useRef({
    travel: 0,
    elapsed: 0,
    scored: 0,
    last: -1,
    dead: false,
    dying: false,
    dyingT: 0,
    fallVx: 0,
    finalScore: 0,
  });

  // Pré-créer les buffers
  const buffers = useMemo(() => {
    return RIBBONS.map(() => {
      const positions = new Float32Array(N_SEG * 6);
      const normals = new Float32Array(N_SEG * 6);
      for (let i = 0; i < N_SEG * 2; i++) {
        normals[i * 3 + 0] = 0;
        normals[i * 3 + 1] = 1;
        normals[i * 3 + 2] = 0;
      }
      const indices = new Uint16Array((N_SEG - 1) * 6);
      for (let i = 0; i < N_SEG - 1; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices[i * 6 + 0] = a;
        indices[i * 6 + 1] = c;
        indices[i * 6 + 2] = b;
        indices[i * 6 + 3] = b;
        indices[i * 6 + 4] = c;
        indices[i * 6 + 5] = d;
      }
      return { positions, normals, indices };
    });
  }, []);

  useFrame((_, dt) => {
    const s = state.current;
    if (s.dead) return;

    // Fall animation when dying
    if (s.dying) {
      s.dyingT += dt;
      const ball = ballRef.current;
      if (ball) {
        ball.position.y -= (4 + s.dyingT * 12) * dt; // gravity accel
        ball.position.x += s.fallVx * dt;
        ball.rotation.x += dt * 5;
        ball.rotation.z += dt * 3;
      }
      if (s.dyingT >= 1.0) {
        s.dead = true;
        onDie(s.finalScore);
      }
      return;
    }

    if (!playing) return;

    s.elapsed += dt;
    const diff = 1 + s.elapsed / 28;
    const speed = 6.4 * diff;
    s.travel += speed * dt;

    // Cible latérale
    let targetX = pointer.current.x * 2.5;
    if (s.elapsed < CENTER_LOCK) targetX = 0;
    const lerp = s.elapsed < CENTER_LOCK ? 0.35 : 0.22;

    const here = plateInfo(s.travel);
    const targetY = 0.3 + here.y;

    const ball = ballRef.current;
    if (ball) {
      ball.position.x += (targetX - ball.position.x) * lerp;
      ball.position.y += (targetY - ball.position.y) * 0.25;
      ball.position.z = BALL_Z;
      ball.rotation.x -= speed * dt * 0.7;
    }

    // Caméra
    camera.position.y += (2.2 + here.y - camera.position.y) * 0.18;
    camera.lookAt(0, here.y, 0);

    // Mise à jour ribbons
    for (let ri = 0; ri < RIBBONS.length; ri++) {
      const r = RIBBONS[ri];
      const buf = buffers[ri];
      const geom = ribbonRefs.current[ri];
      if (!geom) continue;
      for (let i = 0; i < N_SEG; i++) {
        const d = s.travel - BEHIND + i * STEP;
        const x = curve(d);
        const y = plateInfo(d).y;
        const z = BALL_Z - (i * STEP - BEHIND);
        const dxT = curve(d + 0.25) - curve(d - 0.25);
        const dzT = -0.5;
        let nx = dzT;
        let nz = -dxT;
        const L = Math.hypot(nx, nz) || 1;
        nx /= L;
        nz /= L;
        const yy = y + r.yOff;
        const off = i * 6;
        buf.positions[off + 0] = x + nx * r.leftB;
        buf.positions[off + 1] = yy;
        buf.positions[off + 2] = z + nz * r.leftB;
        buf.positions[off + 3] = x + nx * r.rightB;
        buf.positions[off + 4] = yy;
        buf.positions[off + 5] = z + nz * r.rightB;
      }
      const attr = geom.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (attr) {
        attr.needsUpdate = true;
        geom.computeBoundingSphere();
      }
    }

    // Collision
    if (ball && s.elapsed > INVULN) {
      if (Math.abs(ball.position.x - here.baseX) > TRACK_HW + TOL) {
        s.dying = true;
        s.dyingT = 0;
        s.finalScore = Math.floor(s.elapsed / 2);
        // Push ball off the side it left from
        s.fallVx = ball.position.x > here.baseX ? 2.5 : -2.5;
        return;
      }
    }

    // Score = +1 toutes les 2 secondes
    const sec = Math.floor(s.elapsed / 2);
    if (sec !== s.last) {
      s.last = sec;
      s.scored = sec;
      onScore(sec);
    }
  });

  return (
    <>
      <fog attach="fog" args={['#0a0518', 14, 30]} />
      <color attach="background" args={['#0a0518']} />
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 6, 3]} color="#a855f7" intensity={1.3} />
      <pointLight position={[0, 2, BALL_Z]} color="#22d3ee" intensity={0.7} />

      <gridHelper args={[40, 20, '#3b1f6a', '#1a0f33']} position={[0, -1.2, -10]} />

      <BackgroundDecor />

      {RIBBONS.map((r, i) => (
        <mesh key={i}>
          <bufferGeometry
            ref={(g) => { ribbonRefs.current[i] = g; }}
          >
            <bufferAttribute
              attach="attributes-position"
              args={[buffers[i].positions, 3]}
              count={N_SEG * 2}
            />
            <bufferAttribute
              attach="attributes-normal"
              args={[buffers[i].normals, 3]}
              count={N_SEG * 2}
            />
            <bufferAttribute
              attach="index"
              args={[buffers[i].indices, 1]}
              count={buffers[i].indices.length}
            />
          </bufferGeometry>
          <meshStandardMaterial
            color={r.color}
            emissive={r.emissive}
            emissiveIntensity={r.intensity}
            side={THREE.DoubleSide}
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>
      ))}

      <mesh ref={ballRef} position={[0, 0.3, BALL_Z]}>
        <sphereGeometry args={[0.22, 24, 16]} />
        <meshStandardMaterial color="#e879f9" emissive="#d946ef" emissiveIntensity={0.9} roughness={0.3} metalness={0.4} />
      </mesh>
    </>
  );
};

// ===== Composant principal =====
export const BallBalance3DGame: React.FC<BallBalance3DGameProps> = ({
  onBack,
  onGameOver,
  isSoundMuted,
  onToggleSound,
  playFailure,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      return saved[BEST_KEY] || 0;
    } catch { return 0; }
  });
  const sceneKey = useRef(0);
  const startedAt = useRef(0);
  const { pointer, handlers, elRef } = usePointerTrack();

  const handleStart = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
    sceneKey.current++;
    setScore(0);
    startedAt.current = Date.now();
    setPhase('playing');
  }, [pointer]);

  const handleScore = useCallback((s: number) => {
    setScore(s);
  }, []);

  const handleDie = useCallback((finalScore: number) => {
    playFailure?.();
    setPhase('gameover');
    // Persist best
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      const prevBest = saved[BEST_KEY] || 0;
      if (finalScore > prevBest) {
        saved[BEST_KEY] = finalScore;
        localStorage.setItem('luckyStopGame', JSON.stringify(saved));
        setBest(finalScore);
      }
    } catch {}
    const duration = Math.max(0, (Date.now() - startedAt.current) / 1000);
    onGameOver?.(finalScore, duration);
  }, [onGameOver, playFailure]);

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 z-20 relative">
        <Button variant="outline" size="sm" onClick={onBack} className="border-wheel-border">
          <ArrowLeft className="w-4 h-4 mr-1" /> Menu
        </Button>
        <div className="text-right">
          <div className="text-xs text-text-muted uppercase tracking-wider">Score</div>
          <div className="text-3xl font-bold text-primary tabular-nums">{score}</div>
        </div>
        {onToggleSound && (
          <Button variant="outline" size="sm" onClick={onToggleSound} className="border-wheel-border">
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <div
          ref={elRef}
          className="absolute inset-0 touch-none select-none"
          {...handlers}
        >
          <Canvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [0, 2.2, 6], fov: 60, near: 0.1, far: 100 }}
            style={{ background: '#0a0518' }}
          >
            <ResponsiveCamera />
            <GameScene
              pointer={pointer}
              onScore={handleScore}
              onDie={handleDie}
              playing={phase === 'playing'}
            />
          </Canvas>

          {/* Overlays */}
          {phase === 'menu' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0518]/85 via-[#1a0a3a]/80 to-[#0a0518]/90 backdrop-blur-md">
              <div className="relative text-center max-w-sm px-6 py-8 mx-4 rounded-3xl border border-primary/30 bg-gradient-to-b from-[#1a0a3a]/80 to-[#0a0518]/80 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)] overflow-hidden">
                {/* Decorative glow orbs */}
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-cyan-400/30 blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="inline-block mb-4 px-4 py-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 text-xs uppercase tracking-[0.2em] font-semibold">
                    Nouveau mode
                  </div>
                  <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    Ball Balance 3D
                  </h2>
                  <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                    Glisse ton doigt pour guider la bille sur la piste sinueuse.<br/>
                    Tiens le plus longtemps possible !
                  </p>

                  <div className="mb-6 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-primary/20">
                    <span className="text-xs uppercase tracking-wider text-text-muted">Record</span>
                    <span className="text-2xl font-bold tabular-nums bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                      {best}s
                    </span>
                  </div>

                  <Button
                    onClick={handleStart}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:scale-105 transition-transform shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] text-white font-bold py-6"
                  >
                    <Play className="w-5 h-5 mr-2 fill-white" /> Jouer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center bg-game-dark/80 backdrop-blur-sm">
              <div className="text-center max-w-sm px-6">
                <h2 className="text-3xl font-bold text-danger mb-3">Perdu !</h2>
                <div className="mb-2 text-text-secondary">Score</div>
                <div className="text-5xl font-bold text-primary mb-4 tabular-nums">{score}</div>
                <div className="mb-6 text-text-muted text-sm">
                  Meilleur : <span className="text-primary font-bold">{best}s</span>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={onBack} variant="outline" className="border-wheel-border">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Menu
                  </Button>
                  <Button onClick={handleStart} className="bg-gradient-primary">
                    <RotateCcw className="w-4 h-4 mr-2" /> Rejouer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BallBalance3DGame;
