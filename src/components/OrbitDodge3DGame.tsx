import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { GameCanvas } from '@/components/GameCanvas';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, Target, AlertTriangle } from 'lucide-react';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { GameOverActions } from '@/components/GameOverActions';
import { BoostType } from '@/types/boosts';

/**
 * Orbit Dodge — Cahier des charges fidèle.
 * Remplace l'ancien mode "Zone traîtresse". Conserve `bestScore_zone_traitresse`
 * pour préserver la compatibilité du classement.
 */

interface OrbitDodge3DGameProps {
  onBack?: () => void;
  onGameOver?: (score: number, gameDuration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
  selectedBoosts?: string[];
  onSetBoosts?: (b: BoostType[]) => void;
}

// ===== Constantes =====
const TOWER_R = 0.35;
const ORBIT_R = 1.75;
const PLAYER_Y = 0;
const SPAWN_Y = 9;
const KILL_Y = -3;
const BEST_KEY = 'bestScore_zone_traitresse';

interface RingDef {
  group: THREE.Group;
  holeAngle: number;
  holeWidth: number;
  passed: boolean;
  dangerMat: THREE.MeshStandardMaterial;
}

function buildRing(holeAngle: number, holeWidth: number): RingDef {
  const group = new THREE.Group();
  const segments = 56;
  const inner = ORBIT_R - 0.24;
  const outer = ORBIT_R + 0.34;
  const thickness = 0.24;
  const r = (inner + outer) / 2;

  const dangerMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0xbe123c,
    emissiveIntensity: 0.85,
    metalness: 0.3,
    roughness: 0.4,
  });

  const hazardMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.85,
  });

  for (let i = 0; i < segments; i++) {
    const mid = ((i + 0.5) / segments) * Math.PI * 2;
    let delta = mid - holeAngle;
    delta = ((delta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(delta) < holeWidth / 2) continue;

    const len = ((Math.PI * 2) / segments) * r * 1.12;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(len, thickness, outer - inner),
      dangerMat
    );
    box.position.set(Math.cos(mid) * r, 0, Math.sin(mid) * r);
    box.rotation.y = -mid + Math.PI / 2;
    group.add(box);

    const band = new THREE.Mesh(
      new THREE.BoxGeometry(len * 0.92, 0.035, (outer - inner) * 0.32),
      hazardMat
    );
    band.position.set(Math.cos(mid) * r, thickness / 2 + 0.01, Math.sin(mid) * r);
    band.rotation.y = -mid + Math.PI / 2;
    group.add(band);
  }

  return { group, holeAngle, holeWidth, passed: false, dangerMat };
}

// ===== Pointer drag (horizontal) =====
function useDragAngle(angleRef: React.MutableRefObject<number>) {
  const dragRef = useRef<{ x: number; pid: number } | null>(null);
  const handlers = React.useMemo(() => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = { x: e.clientX, pid: e.pointerId };
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.x;
      angleRef.current += (dx / 280) * Math.PI;
      dragRef.current.x = e.clientX;
    },
    onPointerUp: () => { dragRef.current = null; },
    onPointerCancel: () => { dragRef.current = null; },
  }), [angleRef]);
  return { handlers, dragRef };
}

// ===== Background decor =====
const BackgroundDecor: React.FC = () => {
  const starsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const orbsRef = useRef<THREE.Group>(null);
  const halosRef = useRef<THREE.Group>(null);
  const startRef = useRef(performance.now() / 1000);

  const starsGeo = React.useMemo(() => {
    const N = 220;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 16 + Math.random() * 10;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const dustGeo = React.useMemo(() => {
    const N = 90;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3.5 + Math.random() * 5;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const orbs = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.6;
      const r = 6 + Math.random() * 4;
      return {
        a,
        r,
        y: -1 + Math.random() * 4,
        scale: 0.35 + Math.random() * 0.5,
        color: i % 2 === 0 ? '#a855f7' : '#22d3ee',
        speed: 0.06 + Math.random() * 0.08,
      };
    });
  }, []);

  useFrame((_, dt) => {
    const elapsed = performance.now() / 1000 - startRef.current;
    if (starsRef.current) starsRef.current.rotation.y += dt * 0.015;
    if (dustRef.current) {
      dustRef.current.rotation.y -= dt * 0.04;
      dustRef.current.position.y = Math.sin(elapsed * 0.6) * 0.3;
    }
    if (orbsRef.current) {
      orbsRef.current.children.forEach((c, i) => {
        const o = orbs[i];
        o.a += o.speed * dt;
        c.position.set(
          Math.cos(o.a) * o.r,
          o.y + Math.sin(elapsed * 0.8 + i) * 0.4,
          Math.sin(o.a) * o.r
        );
      });
    }
    if (halosRef.current) {
      halosRef.current.rotation.y += dt * 0.05;
      const s = 1 + Math.sin(elapsed * 1.2) * 0.02;
      halosRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <points ref={starsRef} geometry={starsGeo}>
        <pointsMaterial color="#c4b5fd" size={0.09} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
      </points>
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial color="#e879f9" size={0.06} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <group ref={orbsRef}>
        {orbs.map((o, i) => (
          <mesh key={i} scale={o.scale}>
            <sphereGeometry args={[0.35, 14, 12]} />
            <meshBasicMaterial color={o.color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <group ref={halosRef} position={[0, 4.5, -8]}>
        <mesh>
          <ringGeometry args={[3.2, 3.45, 64]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[4.4, 4.55, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Floor decorative rings */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 5.6, 96]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.2, 7.28, 96]} />
        <meshBasicMaterial color="#0e7490" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.0, 9.05, 96]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Floor disc */}
      <mesh position={[0, -2.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[10, 64]} />
        <meshBasicMaterial color="#0d0820" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      <gridHelper args={[60, 30, '#6d28d9', '#1a0b3a']} position={[0, -2.5, 0]} />
    </group>
  );
};

// ===== Tower with sliding rings =====
const Tower: React.FC<{ getSpeed: () => number }> = ({ getSpeed }) => {
  const ringsRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ringsRef.current) return;
    const speed = getSpeed();
    ringsRef.current.children.forEach((c) => {
      c.position.y -= speed * dt * 0.5;
      if (c.position.y < -4) c.position.y += 12;
    });
  });
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[TOWER_R, TOWER_R, 14, 32]} />
        <meshStandardMaterial
          color="#1e1b4b"
          emissive="#4c1d95"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.35}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.1575, 0.1575, 14.2, 16]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.55} />
      </mesh>
      <group ref={ringsRef}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0, -2 + i * 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.39, 0.018, 6, 24]} />
            <meshBasicMaterial color="#a78bfa" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ===== Scene =====
interface SceneProps {
  angleRef: React.MutableRefObject<number>;
  onScore: (s: number) => void;
  onDie: (final: number) => void;
  onNextHole: (rel: number | null) => void;
  playing: boolean;
}

const Scene: React.FC<SceneProps> = ({ angleRef, onScore, onDie, onNextHole, playing }) => {
  const playerRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const ringsContainerRef = useRef<THREE.Group>(null);
  const stateRef = useRef({ elapsed: 0, spawn: 0, passed: 0, dead: false, rings: [] as RingDef[] });

  useEffect(() => {
    stateRef.current = { elapsed: 0, spawn: 0, passed: 0, dead: false, rings: [] };
    if (ringsContainerRef.current) {
      while (ringsContainerRef.current.children.length) {
        ringsContainerRef.current.remove(ringsContainerRef.current.children[0]);
      }
    }
  }, [playing]);

  const speedRef = useRef(2.2);

  useFrame((_, dt) => {
    if (!playing || stateRef.current.dead) return;
    const s = stateRef.current;
    s.elapsed += dt;

    const diff = 1 + s.elapsed / 35;
    const speed = 2.2 * diff;
    speedRef.current = speed;
    const interval = Math.max(1.0, 2.0 / Math.sqrt(diff));

    s.spawn += dt;
    if (s.spawn > interval) {
      s.spawn = 0;
      const holeAngle = Math.random() * Math.PI * 2;
      const holeWidth = Math.max(1.2, 1.9 - s.elapsed * 0.010);
      const ring = buildRing(holeAngle, holeWidth);
      ring.group.position.y = SPAWN_Y;
      ringsContainerRef.current?.add(ring.group);
      s.rings.push(ring);
    }

    const a = angleRef.current;
    if (playerRef.current) {
      playerRef.current.position.set(Math.cos(a) * ORBIT_R, PLAYER_Y, Math.sin(a) * ORBIT_R);
      playerRef.current.rotation.x += dt * 1.5;
      playerRef.current.rotation.y += dt * 1.8;
    }
    if (trailRef.current && playerRef.current) {
      trailRef.current.position.copy(playerRef.current.position);
      trailRef.current.rotation.y += dt * 3;
      const mat = trailRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(s.elapsed * 5) * 0.15;
    }

    for (let i = s.rings.length - 1; i >= 0; i--) {
      const ring = s.rings[i];
      ring.group.position.y -= speed * dt;
      const dy = Math.abs(ring.group.position.y - PLAYER_Y);
      const close = Math.max(0, 1 - dy / 3.5);
      ring.dangerMat.emissiveIntensity =
        0.7 + close * 1.8 + (close > 0.8 ? Math.sin(s.elapsed * 22) * 0.5 : 0);
      const sc = 1 + close * 0.07;
      ring.group.scale.set(sc, 1, sc);

      if (
        !ring.passed &&
        ring.group.position.y <= PLAYER_Y + 0.25 &&
        ring.group.position.y >= PLAYER_Y - 0.25
      ) {
        const diffA = ((a - ring.holeAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        if (Math.abs(diffA) > ring.holeWidth / 2 - 0.05) {
          stateRef.current.dead = true;
          onDie(s.passed);
          return;
        }
        ring.passed = true;
        s.passed += 1;
        onScore(s.passed);
      }

      if (ring.group.position.y < KILL_Y) {
        ringsContainerRef.current?.remove(ring.group);
        s.rings.splice(i, 1);
      }
    }

    // Compass — next opening
    const next = s.rings.find((r) => !r.passed);
    if (next) {
      const rel = ((next.holeAngle - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      onNextHole(rel);
    } else {
      onNextHole(null);
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 6, 4]} intensity={1.3} color="#a855f7" />
      <pointLight position={[-4, 3, -3]} intensity={1.0} color="#22d3ee" />
      <pointLight position={[0, -2, 6]} intensity={0.7} color="#ec4899" />
      <fog attach="fog" args={['#0a0518', 12, 26]} />

      <BackgroundDecor />

      {/* Orbit ring beneath player */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ORBIT_R - 0.05, ORBIT_R + 0.05, 64]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      <Tower getSpeed={() => speedRef.current} />

      {/* Impact line at player level */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ORBIT_R, 0.025, 10, 96]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.75} />
      </mesh>

      <group ref={ringsContainerRef} />

      {/* Trail */}
      <mesh ref={trailRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.04, 8, 24]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Player */}
      <mesh ref={playerRef} position={[ORBIT_R, PLAYER_Y, 0]}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color="#e879f9"
          emissive="#ec4899"
          emissiveIntensity={1.0}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </>
  );
};

export const OrbitDodge3DGame: React.FC<OrbitDodge3DGameProps> = ({
  onBack, onGameOver, isSoundMuted, onToggleSound, playSuccess, playFailure, selectedBoosts, onSetBoosts,
}) => {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [menuBoosts, setMenuBoosts] = useState<BoostType[]>(() => (selectedBoosts || []) as BoostType[]);
  useEffect(() => { setMenuBoosts((selectedBoosts || []) as BoostType[]); }, [selectedBoosts]);
  const [best, setBest] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      return saved[BEST_KEY] || 0;
    } catch { return 0; }
  });
  const angleRef = useRef(0);
  const compassRef = useRef<number | null>(null);
  const [, force] = useState(0);
  const startedAt = useRef(0);
  const sceneKey = useRef(0);
  const offsetRef = useRef(0);
  const shieldRef = useRef(false);

  const { handlers } = useDragAngle(angleRef);

  const handleStart = useCallback(() => {
    sceneKey.current++;
    offsetRef.current = menuBoosts.includes('start_20') ? 20 : 0;
    shieldRef.current = menuBoosts.includes('shield');
    onSetBoosts?.(menuBoosts);
    setScore(offsetRef.current);
    angleRef.current = 0;
    compassRef.current = null;
    startedAt.current = Date.now();
    setPhase('playing');
  }, [menuBoosts, onSetBoosts]);

  const handleScore = useCallback((s: number) => {
    setScore(offsetRef.current + s);
    if (s > 0) playSuccess?.();
  }, [playSuccess]);

  const handleNextHole = useCallback((rel: number | null) => {
    if (rel !== compassRef.current) {
      compassRef.current = rel;
      force((n) => (n + 1) % 1000);
    }
  }, []);

  const handleDie = useCallback((finalRaw: number) => {
    const finalScore = offsetRef.current + finalRaw;
    if (shieldRef.current) {
      shieldRef.current = false;
      offsetRef.current = finalScore;
      sceneKey.current++;
      angleRef.current = 0;
      compassRef.current = null;
      setScore(finalScore);
      return;
    }
    playFailure?.();
    setPhase('gameover');
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      const prev = saved[BEST_KEY] || 0;
      if (finalScore > prev) {
        saved[BEST_KEY] = finalScore;
        localStorage.setItem('luckyStopGame', JSON.stringify(saved));
        setBest(finalScore);
      }
    } catch {}
    const duration = Math.max(0, (Date.now() - startedAt.current) / 1000);
    onGameOver?.(finalScore, duration);
  }, [onGameOver, playFailure]);

  const handleRevive = useCallback(() => {
    offsetRef.current = score;
    shieldRef.current = false;
    sceneKey.current++;
    angleRef.current = 0;
    compassRef.current = null;
    startedAt.current = Date.now();
    setPhase('playing');
  }, [score]);

  const rel = compassRef.current;
  const aligned = rel !== null && Math.abs(rel) < 0.2;
  const compassDeg = rel !== null ? (rel * 180) / Math.PI : 0;

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col">
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

      <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden border border-border bg-black">
        <div className="absolute inset-0 touch-none select-none" {...handlers}>
          <GameCanvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [0, 7.5, 5], fov: 55 }}
            onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
            style={{ background: '#0a0518' }}
          >
            <Scene
              angleRef={angleRef}
              onScore={handleScore}
              onDie={handleDie}
              onNextHole={handleNextHole}
              playing={phase === 'playing'}
            />
          </GameCanvas>

          {/* Compass */}
          {phase === 'playing' && (
            <>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-black/45 backdrop-blur-sm border ${aligned ? 'border-amber-300/70 shadow-[0_0_20px_rgba(251,191,36,0.45)]' : 'border-amber-300/30'}`}>
                  <div className="relative w-10 h-10 rounded-full border border-amber-300/40 flex items-center justify-center">
                    <div
                      className={`absolute w-[2px] h-4 rounded-full ${aligned ? 'bg-emerald-300' : 'bg-amber-300'}`}
                      style={{ transform: `rotate(${compassDeg}deg) translateY(-7px)`, transformOrigin: 'center' }}
                    />
                    <div className={`w-1.5 h-1.5 rounded-full ${aligned ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider font-semibold ${aligned ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {aligned ? 'Aligné' : "Vise l'ouverture"}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm border border-rose-500/40 text-rose-200 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Danger
                </div>
              </div>
            </>
          )}

          {/* Menu */}
          {phase === 'menu' && (
            <GameStartOverlay
              title="Orbit Dodge"
              titleGradient="from-purple-300 via-fuchsia-300 to-cyan-300"
              bestValue={best}
              currentMode={'zone_traitresse' as any}
              selectedBoosts={menuBoosts}
              onSelectedBoostsChange={setMenuBoosts}
              onStart={handleStart}
              rules={[
                { icon: <Hand className="w-4 h-4 text-fuchsia-300" />, title: 'Glisse', desc: 'horizontalement — la bille orbite autour de la tour' },
                { icon: <Target className="w-4 h-4 text-amber-300" />, title: 'Boussole', desc: 'la flèche jaune pointe vers l\'ouverture', accent: 'highlight' },
                { icon: <AlertTriangle className="w-4 h-4 text-rose-300" />, title: 'Segments rouges', desc: 'les toucher = fin de partie', accent: 'danger' },
              ]}
            />
          )}

          {phase === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center bg-game-dark/80 backdrop-blur-sm">
              <div className="text-center max-w-sm px-6">
                <h2 className="text-3xl font-bold text-danger mb-3">Game Over</h2>
                <div className="mb-2 text-text-secondary">Score</div>
                <div className="text-5xl font-bold text-primary mb-4 tabular-nums">{score}</div>
                <div className="mb-6 text-text-muted text-sm">
                  {score > 0 && score >= best ? (
                    <span className="text-yellow-300 font-bold">★ Nouveau record</span>
                  ) : (
                    <>Meilleur : <span className="text-primary font-bold">{best}</span></>
                  )}
                </div>
                <GameOverActions onMenu={onBack!} onReplay={handleStart} onOpenBoosts={() => setPhase('menu')} onRevive={handleRevive} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrbitDodge3DGame;
