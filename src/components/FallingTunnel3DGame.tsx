import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, Target, Zap } from 'lucide-react';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { BoostType } from '@/types/boosts';

/**
 * Falling Tunnel 3D — Cahier des charges fidèle.
 * Remplace l'ancien mode "Zone mobile". Conserve `bestScore_zone_mobile`
 * pour préserver la compatibilité du classement.
 */

interface FallingTunnel3DGameProps {
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
const FIELD_R = 1.9;
const PLAYER_Z = 4;
const PLAYER_Y = 5.6;
const CAMERA_LOOK_Y = PLAYER_Y - 4.2; // 1.4
const SPAWN_Z = -26;
const FINGER_LIFT = 0.5;
const BEST_KEY = 'bestScore_zone_mobile';

interface Plate {
  group: THREE.Group;
  ox: number;
  oy: number;
  hole: number;
  passed: boolean;
  ghost: THREE.Mesh;
  ring: THREE.Mesh;
  glow: THREE.Mesh;
  materials: THREE.Material[];
}

function buildPlate(hole: number, ox: number, oy: number): Plate {
  const group = new THREE.Group();
  const t = 0.28;
  const R = FIELD_R + 0.25;
  const materials: THREE.Material[] = [];

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a0f33,
    emissive: 0x4c1d95,
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.35,
    transparent: true,
    opacity: 0.92,
  });
  (frameMat as any).__base = 0.92;
  materials.push(frameMat);

  const panels = [
    { w: R + ox - hole, h: R * 2, x: -R + (R + ox - hole) / 2, y: 0 },
    { w: R - ox - hole, h: R * 2, x: R - (R - ox - hole) / 2, y: 0 },
    { w: hole * 2, h: R + oy - hole, x: ox, y: -R + (R + oy - hole) / 2 },
    { w: hole * 2, h: R - oy - hole, x: ox, y: R - (R - oy - hole) / 2 },
  ];
  for (const p of panels) {
    if (p.w > 0.05 && p.h > 0.05) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(p.w, p.h, t), frameMat);
      m.position.set(p.x, p.y, 0);
      group.add(m);
    }
  }

  // Ring (green torus around hole)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 1 });
  (ringMat as any).__base = 1;
  materials.push(ringMat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(hole * 1.05, 0.05, 8, 28), ringMat);
  ring.position.set(ox, oy, t / 2 + 0.01);
  group.add(ring);

  // Glow (additive disc)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  (glowMat as any).__base = 0.12;
  materials.push(glowMat);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(hole * 0.98, 40), glowMat);
  glow.position.set(ox, oy, t / 2 + 0.005);
  group.add(glow);

  // Ghost (ball projection)
  const ghostMat = new THREE.MeshBasicMaterial({
    color: 0xe879f9,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  (ghostMat as any).__base = 0.55;
  materials.push(ghostMat);
  const ghost = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 24), ghostMat);
  ghost.position.set(0, 0, t / 2 + 0.02);
  group.add(ghost);

  return { group, ox, oy, hole, passed: false, ghost, ring, glow, materials };
}

// ===== Pointer tracking =====
function usePointerTrack() {
  const pointerRef = useRef({ x: 0, y: 0 });
  const handlers = React.useMemo(() => {
    let active = false;
    const update = (e: PointerEvent | React.PointerEvent, target: HTMLElement) => {
      const r = target.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointerRef.current.x = Math.max(-1, Math.min(1, x));
      pointerRef.current.y = Math.max(-1, Math.min(1, y));
    };
    return {
      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
        active = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e, e.currentTarget);
      },
      onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
        if (active || e.pointerType === 'mouse') update(e, e.currentTarget);
      },
      onPointerUp: () => { active = false; },
      onPointerCancel: () => { active = false; },
    };
  }, []);
  return { pointerRef, handlers };
}

// ===== Background decor =====
const StarField: React.FC = () => {
  const geom = React.useMemo(() => {
    const count = 110;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cPink = new THREE.Color('#e879f9');
    const cPurple = new THREE.Color('#a855f7');
    const cWhite = new THREE.Color('#ffffff');
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 1 + Math.random() * 18;
      positions[i * 3 + 2] = -30 - Math.random() * 25;
      const p = Math.random();
      const c = p < 0.5 ? cPink : p < 0.85 ? cPurple : cWhite;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <points geometry={geom}>
      <pointsMaterial size={0.09} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
};

const SpeedStreaks: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  const streaks = React.useMemo(() => {
    const arr: { x: number; y: number; z: number; len: number; color: string }[] = [];
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2.4 + Math.random() * 2.8;
      arr.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r + 1,
        z: -26 + Math.random() * 26,
        len: 1.2 + Math.random() * 2.4,
        color: Math.random() < 0.5 ? '#a855f7' : '#22d3ee',
      });
    }
    return arr;
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      c.position.z += dt * 22;
      if (c.position.z > 8) {
        const a = Math.random() * Math.PI * 2;
        const r = 2.4 + Math.random() * 2.8;
        c.position.set(Math.cos(a) * r, Math.sin(a) * r + 1, -28);
      }
    });
  });
  return (
    <group ref={ref}>
      {streaks.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]}>
          <boxGeometry args={[0.025, 0.025, s.len]} />
          <meshBasicMaterial color={s.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

const FloatingShapes: React.FC = () => {
  const ref = useRef<THREE.Group>(null);
  const items = React.useMemo(() => {
    const colors = ['#a855f7', '#22d3ee', '#ec4899', '#f59e0b'];
    return Array.from({ length: 14 }, (_, i) => ({
      type: i % 3,
      size: 0.25 + Math.random() * 0.45,
      x: (i % 2 === 0 ? -1 : 1) * (4 + Math.random() * 5),
      y: 1 + Math.random() * 6,
      z: -28 + Math.random() * 22,
      color: colors[i % colors.length],
    }));
  }, []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => {
      c.rotation.x += dt * (0.3 + (i % 3) * 0.1);
      c.rotation.y += dt * (0.2 + (i % 4) * 0.08);
      c.position.y += Math.sin(performance.now() * 0.001 + i) * dt * 0.15;
    });
  });
  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]}>
          {it.type === 0 ? (
            <icosahedronGeometry args={[it.size, 0]} />
          ) : it.type === 1 ? (
            <octahedronGeometry args={[it.size, 0]} />
          ) : (
            <tetrahedronGeometry args={[it.size, 0]} />
          )}
          <meshBasicMaterial color={it.color} wireframe transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

// ===== Scene =====
interface SceneProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  onScore: (s: number) => void;
  onDie: (final: number) => void;
  playing: boolean;
}

const Scene: React.FC<SceneProps> = ({ pointerRef, onScore, onDie, playing }) => {
  const ballRef = useRef<THREE.Mesh>(null);
  const platesGroupRef = useRef<THREE.Group>(null);
  const platesRef = useRef<Plate[]>([]);
  const stateRef = useRef({ elapsed: 0, spawnTimer: 0, score: 0, dead: false, pulse: 0 });
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, CAMERA_LOOK_Y, -10);
  }, [camera]);

  // Reset on (re)mount
  useEffect(() => {
    stateRef.current = { elapsed: 0, spawnTimer: 0, score: 0, dead: false, pulse: 0 };
    if (platesGroupRef.current) {
      while (platesGroupRef.current.children.length) {
        platesGroupRef.current.remove(platesGroupRef.current.children[0]);
      }
    }
    platesRef.current = [];
    if (ballRef.current) {
      ballRef.current.position.set(0, PLAYER_Y, PLAYER_Z);
    }
  }, []);

  useFrame((_, dt) => {
    if (!playing || stateRef.current.dead) return;
    const s = stateRef.current;
    s.elapsed += dt;

    const diff = 1 + s.elapsed / 28;
    const speed = 8 * diff;
    const interval = Math.max(0.6, 1.5 / Math.sqrt(diff));
    const hole = Math.max(0.6, 1.0 - s.elapsed * 0.011);

    // Ball follow
    const rawX = pointerRef.current.x;
    const rawY = pointerRef.current.y;
    const liftedY = Math.max(-1, Math.min(1, rawY + FINGER_LIFT));
    const tx = rawX * (FIELD_R + 0.5);
    const ty = liftedY * (FIELD_R + 0.5) + PLAYER_Y;
    if (ballRef.current) {
      ballRef.current.position.x += (tx - ballRef.current.position.x) * 0.52;
      ballRef.current.position.y += (ty - ballRef.current.position.y) * 0.52;
      ballRef.current.position.z = PLAYER_Z;
      ballRef.current.rotation.x += dt * 1.2;
      ballRef.current.rotation.y += dt * 1.5;
      // pulse scale on pass
      const scl = 1 + s.pulse * 0.6;
      ballRef.current.scale.setScalar(scl);
      s.pulse = Math.max(0, s.pulse - dt * 3);
    }

    // Spawn
    s.spawnTimer += dt;
    if (s.spawnTimer >= interval) {
      s.spawnTimer = 0;
      const ox = (Math.random() * 2 - 1) * (FIELD_R - hole - 0.1);
      const oy = (Math.random() * 2 - 1) * (FIELD_R - hole - 0.1);
      const plate = buildPlate(hole, ox, oy);
      plate.group.position.set(0, PLAYER_Y, SPAWN_Z);
      platesGroupRef.current?.add(plate.group);
      platesRef.current.push(plate);
    }

    // Move plates
    const bx = ballRef.current?.position.x ?? 0;
    const by = ballRef.current?.position.y ?? PLAYER_Y;
    const list = platesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.group.position.z += speed * dt;
      const z = p.group.position.z;

      // Scale + fade in
      const distFromSpawn = z - SPAWN_Z;
      const spawnIn = Math.max(0, Math.min(1, distFromSpawn / 6));
      const closeness = Math.max(0, Math.min(1, 1 - (PLAYER_Z - z) / 22));
      const baseScale = 0.4 + closeness * 0.55;
      const scl = baseScale * (0.3 + spawnIn * 0.7);
      p.group.scale.setScalar(scl);
      for (const m of p.materials) {
        const base = (m as any).__base ?? 1;
        (m as any).opacity = base * spawnIn;
      }

      // Ghost — hide as soon as the plate reaches/passes the player
      const showGhost = !p.passed && z < PLAYER_Z;
      p.ghost.visible = showGhost;
      if (showGhost) {
        p.ghost.position.x = bx;
        p.ghost.position.y = by - PLAYER_Y;
      }
      const dxg = Math.abs(bx - p.ox);
      const dyg = Math.abs((by - PLAYER_Y) - p.oy);
      const inTarget = dxg < p.hole - 0.22 && dyg < p.hole - 0.22;
      (p.ghost.material as THREE.MeshBasicMaterial).color.setHex(inTarget ? 0x4ade80 : 0xe879f9);

      // Collision/pass plane
      if (!p.passed && z > PLAYER_Z - 0.4 && z < PLAYER_Z + 0.4) {
        if (dxg > p.hole - 0.22 || dyg > p.hole - 0.22) {
          s.dead = true;
          onDie(s.score);
          return;
        } else {
          p.passed = true;
          s.score += 1;
          s.pulse = 1;
          onScore(s.score);
        }
      }

      // Cleanup
      if (z > PLAYER_Z + 3) {
        platesGroupRef.current?.remove(p.group);
        list.splice(i, 1);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 6, 6]} intensity={1.4} color="#a855f7" />
      <pointLight position={[6, 3, -4]} intensity={1.0} color="#22d3ee" />
      <pointLight position={[-4, 4, -16]} intensity={0.8} color="#ec4899" />
      <fog attach="fog" args={['#08041a', 14, 30]} />

      {/* Ball */}
      <mesh ref={ballRef} position={[0, PLAYER_Y, PLAYER_Z]}>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color="#e879f9"
          emissive="#ec4899"
          emissiveIntensity={0.9}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      <group ref={platesGroupRef} />

      <StarField />
      <SpeedStreaks />
      <FloatingShapes />

      {/* Tunnel floor grid */}
      <gridHelper args={[60, 30, '#6d28d9', '#1a0b3a']} position={[0, -2.5, 0]} />
    </>
  );
};

// ===== Responsive camera (ensures horizontal FOV ≥ 78°) =====
const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const cam = camera as THREE.PerspectiveCamera;
    // Set vertical FOV so horizontal ≥ 78°
    const targetH = (78 * Math.PI) / 180;
    const vFov = 2 * Math.atan(Math.tan(targetH / 2) / Math.max(aspect, 0.5));
    cam.fov = Math.max(55, Math.min(80, (vFov * 180) / Math.PI));
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
};

export const FallingTunnel3DGame: React.FC<FallingTunnel3DGameProps> = ({
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
  const startedAt = useRef(0);
  const sceneKey = useRef(0);
  const offsetRef = useRef(0);
  const shieldRef = useRef(false);
  const { pointerRef, handlers } = usePointerTrack();

  const handleStart = useCallback(() => {
    sceneKey.current++;
    offsetRef.current = menuBoosts.includes('start_20') ? 20 : 0;
    shieldRef.current = menuBoosts.includes('shield');
    onSetBoosts?.(menuBoosts);
    setScore(offsetRef.current);
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
    startedAt.current = Date.now();
    setPhase('playing');
  }, [pointerRef, menuBoosts, onSetBoosts]);

  const handleScore = useCallback((s: number) => {
    setScore(offsetRef.current + s);
    if (s > 0) playSuccess?.();
  }, [playSuccess]);

  const handleDie = useCallback((finalRaw: number) => {
    const finalScore = offsetRef.current + finalRaw;
    if (shieldRef.current) {
      shieldRef.current = false;
      offsetRef.current = finalScore;
      sceneKey.current++;
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
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
  }, [onGameOver, playFailure, pointerRef]);

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
        <div
          className="absolute inset-0 touch-none select-none"
          {...handlers}
        >
          <Canvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [0, PLAYER_Y - 0.2, PLAYER_Z + 6], fov: 70, near: 0.1, far: 80 }}
            style={{ background: '#08041a' }}
          >
            <ResponsiveCamera />
            <Scene
              pointerRef={pointerRef}
              onScore={handleScore}
              onDie={handleDie}
              playing={phase === 'playing'}
            />
          </Canvas>

          {/* Menu */}
          {phase === 'menu' && (
            <GameStartOverlay
              title="Falling Tunnel"
              titleGradient="from-purple-300 via-fuchsia-300 to-cyan-300"
              bestValue={best}
              currentMode={'zone_mobile' as any}
              selectedBoosts={menuBoosts}
              onSelectedBoostsChange={setMenuBoosts}
              onStart={handleStart}
              rules={[
                { icon: <Hand className="w-4 h-4 text-fuchsia-300" />, title: 'Glisse', desc: 'ton doigt n\'importe où — la bille suit' },
                { icon: <Target className="w-4 h-4 text-green-300" />, title: 'Anneau vert', desc: 'passe au travers pour +1 point', accent: 'highlight' },
                { icon: <Zap className="w-4 h-4 text-purple-300" />, title: 'Vitesse', desc: 'le rythme augmente avec le temps' },
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

export default FallingTunnel3DGame;
