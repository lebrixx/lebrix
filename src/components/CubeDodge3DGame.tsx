import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Volume2, VolumeX, RotateCcw, MoveHorizontal, Hand, Sparkles, Zap, X, Trophy } from 'lucide-react';
import { BOOSTS, BoostType } from '@/types/boosts';
import { useBoosts } from '@/hooks/useBoosts';
import { GameStartOverlay } from '@/components/GameStartOverlay';

/**
 * Cube Dodge 3D — runner mobile-first.
 * Remplace l'ancien mode "Classique". Conserve la clé bestScore_classic
 * pour rester compatible avec le classement et les défis quotidiens.
 */

interface CubeDodge3DGameProps {
  onBack?: () => void;
  onGameOver?: (score: number, gameDuration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
  selectedBoosts?: string[];
  onSetBoosts?: (boosts: BoostType[]) => void;
}

// ===== Constantes =====
const LANES = [-1.4, 0, 1.4];
const PLAYER_Z = 3;
const SPAWN_Z = -45;
const FULL_W = 4.4;
const COLOR_A = { hex: 0x22d3ee, emissive: 0x0891b2, css: '#22d3ee' };
const COLOR_B = { hex: 0xf472b6, emissive: 0xdb2777, css: '#f472b6' };
const COLORS = [COLOR_A, COLOR_B];
const BEST_KEY = 'bestScore_classic';

// ===== Caméra responsive =====
const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const minHFov = (78 * Math.PI) / 180;
    const aspect = Math.max(size.width / size.height, 0.0001);
    const requiredV = 2 * Math.atan(Math.tan(minHFov / 2) / aspect);
    const v = Math.max((60 * Math.PI) / 180, requiredV);
    cam.fov = Math.min((v * 180) / Math.PI, 95);
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
};

// ===== Pointer input (TAP swap + SWIPE lane) =====
function usePointerInput(onTap: () => void, onSwipe: (dir: -1 | 1) => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      const d = down.current;
      down.current = null;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      const dist = Math.hypot(dx, dy);
      const dur = performance.now() - d.t;
      if (dist < 16 && dur < 250) {
        onTap();
      } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
        onSwipe(dx > 0 ? 1 : -1);
      }
    },
    onPointerCancel: () => { down.current = null; },
  };
  return { ref, handlers };
}

// ===== Scène =====
interface SceneProps {
  laneRef: React.MutableRefObject<number>;
  colorRef: React.MutableRefObject<number>;
  onScore: (n: number) => void;
  onDie: (n: number) => void;
  playing: boolean;
}

interface Block { mesh: THREE.Mesh; lane: number; passed: boolean; }
interface Wall { group: THREE.Group; color: number; passed: boolean; }
interface Portal { group: THREE.Group; lane: number; color: number; ring: THREE.Mesh; passed: boolean; }

const GameScene: React.FC<SceneProps> = ({ laneRef, colorRef, onScore, onDie, playing }) => {
  const { camera, scene } = useThree();
  const playerRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const wallGroupRef = useRef<THREE.Group>(null);
  const portalGroupRef = useRef<THREE.Group>(null);
  const pillarRefs = useRef<THREE.Mesh[]>([]);
  const starsRef = useRef<THREE.Points>(null);
  const horizonRef = useRef<THREE.Mesh>(null);

  const state = useRef({
    elapsed: 0,
    blockTimer: 0,
    wallTimer: 0,
    portalTimer: 0,
    blocks: [] as Block[],
    walls: [] as Wall[],
    portals: [] as Portal[],
    passed: 0,
    lastPassed: -1,
    combo: 0,
    swapPulse: 0,
    dead: false,
    dying: false,
    dyingT: 0,
  });

  // Listen swap event for emissive pulse
  useEffect(() => {
    const onSwap = () => { state.current.swapPulse = 0.4; };
    window.addEventListener('cubedodge:swap', onSwap);
    return () => window.removeEventListener('cubedodge:swap', onSwap);
  }, []);

  // Stars buffer
  const stars = useMemo(() => {
    const c = 220;
    const a = new Float32Array(c * 3);
    for (let i = 0; i < c; i++) {
      a[i * 3] = (Math.random() - 0.5) * 40;
      a[i * 3 + 1] = 1 + Math.random() * 14;
      a[i * 3 + 2] = -62 + Math.random() * 60;
    }
    return a;
  }, []);

  // Helpers — build entities
  const buildBlock = useCallback((lane: number, z: number): Block => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({
        color: 0xff3b6e,
        emissive: 0xff1f55,
        emissiveIntensity: 0.7,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 1,
      })
    );
    m.position.set(LANES[lane], 0.55, z);
    groupRef.current?.add(m);
    return { mesh: m, lane, passed: false };
  }, []);

  const buildWall = useCallback((color: number): Wall => {
    const g = new THREE.Group();
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(FULL_W, 1.8, 0.18),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.1,
        metalness: 0.5, roughness: 0.25, transparent: true, opacity: 0.82,
      })
    );
    panel.position.y = 0.9;
    g.add(panel);
    // 3 stripes blanches
    [0.05, 0.6, 1.15].forEach((y) => {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 0.08, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xfafafa })
      );
      s.position.y = y;
      g.add(s);
    });
    // bordures
    const bMat = new THREE.MeshBasicMaterial({ color });
    [-FULL_W / 2, FULL_W / 2].forEach((x) => {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.24), bMat);
      v.position.set(x, 0.92, 0);
      g.add(v);
    });
    [0.02, 1.78].forEach((y) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(FULL_W, 0.08, 0.24), bMat);
      h.position.y = y;
      g.add(h);
    });
    // beam au sol
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(FULL_W, 30),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.22,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.02, -14);
    g.add(beam);

    wallGroupRef.current?.add(g);
    return { group: g, color, passed: false };
  }, []);

  const buildPortal = useCallback((lane: number, color: number): Portal => {
    const g = new THREE.Group();
    g.position.x = LANES[lane];
    // beam
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 30),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.32,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.02, -14);
    g.add(beam);
    // ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.14, 14, 40),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.8,
        metalness: 0.4, roughness: 0.3,
      })
    );
    ring.position.y = 1.1;
    g.add(ring);
    // disque
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 32),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    disc.position.y = 1.1;
    g.add(disc);
    // flèche du haut
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.45, 4),
      new THREE.MeshBasicMaterial({ color })
    );
    arrow.position.y = 2.4;
    arrow.rotation.x = Math.PI;
    g.add(arrow);

    portalGroupRef.current?.add(g);
    return { group: g, lane, color, ring, passed: false };
  }, []);

  const dispose = (obj: THREE.Object3D) => {
    obj.traverse((c: any) => {
      c.geometry?.dispose?.();
      const mat = c.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
      else mat?.dispose?.();
    });
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = state.current;
    if (s.dead) return;

    // Death fall animation
    if (s.dying) {
      s.dyingT += dt;
      const p = playerRef.current;
      if (p) {
        p.position.y -= 9.5 * dt;
        p.rotation.x += dt * 6;
        p.rotation.z += dt * 4;
      }
      
      if (s.dyingT >= 1.0) {
        s.dead = true;
        onDie(s.passed);
      }
      return;
    }

    if (!playing) return;

    s.elapsed += dt;
    const diff = 1 + s.elapsed / 45;
    const speed = Math.min(14, 9 * diff);

    // Swap pulse decay
    if (s.swapPulse > 0) s.swapPulse = Math.max(0, s.swapPulse - dt);

    // Player
    const targetX = LANES[laneRef.current];
    const p = playerRef.current;
    const currentColor = COLORS[colorRef.current];
    if (p) {
      p.position.x += (targetX - p.position.x) * 0.3;
      p.position.y = 0.5;
      p.position.z = PLAYER_Z;
      p.rotation.z = (targetX - p.position.x) * -0.4;
      p.rotation.y += dt * 1.2;
      const mat = p.material as THREE.MeshStandardMaterial;
      mat.color.setHex(currentColor.hex);
      mat.emissive.setHex(currentColor.emissive);
      mat.emissiveIntensity = 0.9 + s.swapPulse * 1.5;
    }

    // Pillars scroll
    pillarRefs.current.forEach((m) => {
      m.position.z += speed * dt;
      if (m.position.z > 8) m.position.z -= 60;
    });

    // Stars scroll
    const sp = starsRef.current;
    if (sp) {
      const attr = sp.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 2; i < arr.length; i += 3) {
        arr[i] += 6 * dt;
        if (arr[i] > 5) arr[i] = -60;
      }
      attr.needsUpdate = true;
    }

    // Horizon flicker
    if (horizonRef.current) {
      const hm = horizonRef.current.material as THREE.MeshBasicMaterial;
      hm.opacity = 0.35 + Math.sin(s.elapsed * 0.8) * 0.15;
    }

    // Spawn intervals
    s.blockTimer -= dt;
    if (s.blockTimer <= 0) {
      const lane = Math.floor(Math.random() * 3);
      s.blocks.push(buildBlock(lane, SPAWN_Z));
      if (diff > 1.3 && Math.random() < 0.35) {
        let other = Math.floor(Math.random() * 3);
        if (Math.abs(other - lane) <= 1) other = (lane + 2) % 3;
        s.blocks.push(buildBlock(other, SPAWN_Z - 2));
      }
      s.blockTimer = Math.max(0.55, 1.15 / Math.sqrt(diff));
    }

    if (s.elapsed > 3) {
      s.wallTimer -= dt;
      if (s.wallTimer <= 0) {
        const color = COLORS[Math.floor(Math.random() * 2)].hex;
        const w = buildWall(color);
        w.group.position.z = SPAWN_Z + 4;
        s.walls.push(w);
        s.wallTimer = Math.max(2.2, 3.4 / Math.sqrt(diff));
      }
    }

    if (s.elapsed > 5) {
      s.portalTimer -= dt;
      if (s.portalTimer <= 0) {
        const lane = Math.floor(Math.random() * 3);
        const color = COLORS[Math.floor(Math.random() * 2)].hex;
        const por = buildPortal(lane, color);
        por.group.position.z = SPAWN_Z + 8;
        s.portals.push(por);
        s.portalTimer = Math.max(2.6, 4.2 / Math.sqrt(diff));
      }
    }

    // Update blocks
    const playerLane = laneRef.current;
    const playerHex = currentColor.hex;
    let hit = false;
    s.blocks.forEach((b) => {
      b.mesh.position.z += speed * dt;
      const mat = b.mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = 1;
      b.mesh.scale.setScalar(1);
      const dz = b.mesh.position.z - PLAYER_Z;
      if (!b.passed) {
        if (Math.abs(dz) <= 0.5) {
          if (b.lane === playerLane) {
            hit = true;
          }
        }
        if (b.mesh.position.z > PLAYER_Z + 0.5) {
          b.passed = true;
          const adj = Math.abs(b.lane - playerLane) === 1;
          const base = adj ? 2 : 1;
          s.passed += base;
        }
      }
    });

    // Update walls
    s.walls.forEach((w) => {
      w.group.position.z += speed * dt;
      const dz = w.group.position.z - PLAYER_Z;
      if (!w.passed) {
        if (Math.abs(dz) <= 0.35) {
          if (w.color !== playerHex) hit = true;
        }
        if (w.group.position.z > PLAYER_Z + 0.35) {
          w.passed = true;
          s.passed += 3;
        }
      }
    });

    // Update portals
    s.portals.forEach((po) => {
      po.group.position.z += speed * dt;
      po.ring.rotation.z += dt * 2.5;
      const dz = po.group.position.z - PLAYER_Z;
      const dist = Math.abs(dz);
      const rm = po.ring.material as THREE.MeshStandardMaterial;
      rm.emissiveIntensity = dist < 4 ? 1.4 + (4 - dist) * 0.4 : 1.8;
      if (!po.passed) {
        if (dist <= 0.4) {
          if (po.lane === playerLane) {
            if (po.color === playerHex) {
              s.passed += 5;
              s.swapPulse = 0.6;
            } else {
              hit = true;
            }
          }
          po.passed = true;
        }
      }
    });

    // Cleanup behind player
    const remove = <T extends { passed?: boolean }>(arr: T[], getZ: (x: T) => number, kill: (x: T) => void): T[] => {
      const kept: T[] = [];
      for (const x of arr) {
        if (getZ(x) > 6) kill(x);
        else kept.push(x);
      }
      return kept;
    };
    s.blocks = remove(s.blocks, (b) => b.mesh.position.z, (b) => { groupRef.current?.remove(b.mesh); dispose(b.mesh); });
    s.walls = remove(s.walls, (w) => w.group.position.z, (w) => { wallGroupRef.current?.remove(w.group); dispose(w.group); });
    s.portals = remove(s.portals, (po) => po.group.position.z, (po) => { portalGroupRef.current?.remove(po.group); dispose(po.group); });

    // Score callback : +1 toutes les 2 secondes
    const timeScore = Math.floor(s.elapsed / 2);
    if (timeScore !== s.lastPassed) {
      s.lastPassed = timeScore;
      s.passed = timeScore;
      onScore(timeScore);
    }

    if (hit && !s.dying) {
      s.dying = true;
      s.dyingT = 0;
    }
  });

  return (
    <>
      <fog attach="fog" args={['#0a0518', 12, 30]} />
      <color attach="background" args={['#0a0518']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 3]} color="#a855f7" intensity={1.3} />
      <pointLight position={[0, 2, 3]} color="#22d3ee" intensity={0.8} />

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -15]}>
        <planeGeometry args={[5, 100]} />
        <meshStandardMaterial color="#1a0f33" emissive="#2a1758" emissiveIntensity={0.3} />
      </mesh>
      {/* Bords magenta */}
      {[-2.5, 2.5].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, -15]}>
          <planeGeometry args={[0.1, 100]} />
          <meshBasicMaterial color="#e879f9" />
        </mesh>
      ))}
      {/* Lignes cyan centrales */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={`c${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, -15]}>
          <planeGeometry args={[0.06, 100]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      ))}
      {/* Grid */}
      <gridHelper args={[40, 20, '#4c1d95', '#2a1758']} position={[0, 0.001, -25]} />
      {/* Horizon */}
      <mesh ref={horizonRef} position={[0, 3, -35]}>
        <planeGeometry args={[30, 6]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.35} />
      </mesh>
      {/* Piliers */}
      {Array.from({ length: 24 }).map((_, i) => {
        const side = i % 2 === 0 ? -3.2 : 3.2;
        const z = -((i >> 1)) * 5;
        return (
          <mesh
            key={`p${i}`}
            ref={(m) => { if (m) pillarRefs.current[i] = m; }}
            position={[side, 1.2, z]}
          >
            <boxGeometry args={[0.3, 2.4, 0.3]} />
            <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.9} />
          </mesh>
        );
      })}
      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} count={stars.length / 3} />
        </bufferGeometry>
        <pointsMaterial color="#e879f9" size={0.09} transparent opacity={0.85} depthWrite={false} />
      </points>

      {/* Groups */}
      <group ref={groupRef} />
      <group ref={wallGroupRef} />
      <group ref={portalGroupRef} />

      {/* Joueur */}
      <mesh ref={playerRef} position={[0, 0.5, PLAYER_Z]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={COLOR_A.css} emissive={COLOR_A.css} emissiveIntensity={0.9} metalness={0.5} roughness={0.3} />
      </mesh>
    </>
  );
};

// ===== Composant principal =====
export const CubeDodge3DGame: React.FC<CubeDodge3DGameProps> = ({
  onBack,
  onGameOver,
  isSoundMuted,
  onToggleSound,
  playFailure,
  selectedBoosts,
  onSetBoosts,
}) => {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [uiColor, setUiColor] = useState(0);
  
  const [showBoostPicker, setShowBoostPicker] = useState(false);
  const { getBoostCount, removeBoost } = useBoosts();
  const [menuBoosts, setMenuBoosts] = useState<BoostType[]>(() => (selectedBoosts || []) as BoostType[]);
  useEffect(() => { setMenuBoosts((selectedBoosts || []) as BoostType[]); }, [selectedBoosts]);
  const [best, setBest] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      return saved[BEST_KEY] || 0;
    } catch { return 0; }
  });
  const sceneKey = useRef(0);
  const startedAt = useRef(0);
  const offsetRef = useRef(0);
  const shieldRef = useRef(false);

  const laneRef = useRef(1);
  const colorRef = useRef(0);

  const doSwap = useCallback(() => {
    colorRef.current = colorRef.current === 0 ? 1 : 0;
    setUiColor(colorRef.current);
    window.dispatchEvent(new Event('cubedodge:swap'));
  }, []);

  const doSwipe = useCallback((dir: -1 | 1) => {
    laneRef.current = Math.max(0, Math.min(2, laneRef.current + dir));
  }, []);

  const { ref, handlers } = usePointerInput(doSwap, doSwipe);

  // UI refresh poll
  useEffect(() => {
    const id = setInterval(() => {
      setUiColor(colorRef.current);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const handleStart = useCallback(() => {
    laneRef.current = 1;
    colorRef.current = 0;
    sceneKey.current++;
    offsetRef.current = menuBoosts.includes('start_20') ? 20 : 0;
    shieldRef.current = menuBoosts.includes('shield');
    onSetBoosts?.(menuBoosts);
    setScore(offsetRef.current);
    setUiColor(0);
    startedAt.current = Date.now();
    setPhase('playing');
  }, [menuBoosts, onSetBoosts]);

  const handleScore = useCallback((n: number) => setScore(offsetRef.current + n), []);

  const handleDie = useCallback((finalRaw: number) => {
    const finalScore = offsetRef.current + finalRaw;
    if (shieldRef.current) {
      shieldRef.current = false;
      offsetRef.current = finalScore;
      sceneKey.current++;
      laneRef.current = 1;
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
    const dur = Math.max(0, (Date.now() - startedAt.current) / 1000);
    onGameOver?.(finalScore, dur);
  }, [onGameOver, playFailure]);

  const colorCss = uiColor === 0 ? COLOR_A.css : COLOR_B.css;

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

      {/* Canvas + overlay */}
      <div className="flex-1 relative">
        <div
          ref={ref}
          className="absolute inset-0 touch-none select-none"
          {...handlers}
        >
          <Canvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [0, 2.5, 6], fov: 60, near: 0.1, far: 100 }}
            style={{ background: '#0a0518' }}
          >
            <ResponsiveCamera />
            <GameScene
              laneRef={laneRef}
              colorRef={colorRef}
              
              onScore={handleScore}
              onDie={handleDie}
              playing={phase === 'playing'}
            />
          </Canvas>

          {/* In-game overlay */}
          {phase === 'playing' && (
            <>
              {/* Color indicator */}
              <div className="absolute top-3 left-3 px-4 py-2.5 rounded-2xl bg-black/65 backdrop-blur-sm border border-white/15 shadow-lg flex items-center gap-2 pointer-events-none">
                <span
                  className="inline-block w-5 h-5 rounded-full ring-2 ring-white/40 animate-bounce"
                  style={{ backgroundColor: colorCss, boxShadow: `0 0 18px ${colorCss}` }}
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-white">
                  👆 TAP = couleur
                </span>
              </div>

              {/* Phase tag */}
              {phaseUi > 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
                  <div
                    className="px-3 py-1 rounded-full bg-fuchsia-500/90 text-white text-xs font-bold uppercase tracking-wider"
                    style={{ boxShadow: '0 0 18px rgba(232,121,249,0.55)' }}
                  >
                    Phase ×3
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 transition-all"
                      style={{ width: `${(phaseUi / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[9px] uppercase tracking-wider text-white/70 pointer-events-none">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-cyan-300" style={{ boxShadow: '0 0 6px #22d3ee' }} />
                  Portail = couleur ok
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-pink-400/80" />
                  Mur = match
                </div>
              </div>
            </>
          )}

          {/* Start menu — overlay sur le jeu en fond */}
          {phase === 'menu' && (
            <GameStartOverlay
              title="Cube Dodge"
              titleGradient="from-cyan-300 via-fuchsia-300 to-pink-300"
              bestValue={best}
              currentMode={'classic' as any}
              selectedBoosts={menuBoosts}
              onSelectedBoostsChange={setMenuBoosts}
              onStart={handleStart}
              rules={[
                { icon: <MoveHorizontal className="w-4 h-4 text-cyan-300" />, title: 'Swipe', desc: 'gauche/droite pour changer de voie' },
                { icon: <Hand className="w-4 h-4 text-fuchsia-300" />, title: 'Tap', desc: 'change ta couleur (cyan ↔ rose)' },
                { icon: <Sparkles className="w-4 h-4 text-fuchsia-300" />, title: 'PHASE ×3', desc: 'traverse un portail = 3s invincible + score ×3', accent: 'highlight' },
                { icon: <div className="w-3.5 h-3.5 rounded-sm bg-pink-400/80" />, title: 'Murs colorés', desc: 'aligne ta couleur ou game over', accent: 'danger' },
              ]}
            />
          )}

          {/* Game over */}
          {phase === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center bg-game-dark/80 backdrop-blur-sm">
              <div className="text-center max-w-sm px-6">
                <h2 className="text-3xl font-bold text-danger mb-3">Perdu !</h2>
                <div className="mb-2 text-text-secondary">Score</div>
                <div className="text-5xl font-bold text-primary mb-4 tabular-nums">{score}</div>
                <div className="mb-6 text-text-muted text-sm">
                  Record : <span className="text-primary font-bold">{best}</span>
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

export default CubeDodge3DGame;
