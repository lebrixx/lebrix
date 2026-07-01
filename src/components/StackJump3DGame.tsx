import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GameCanvas } from '@/components/GameCanvas';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, AlertTriangle, Sparkles } from 'lucide-react';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { GameOverActions } from '@/components/GameOverActions';
import { BoostType } from '@/types/boosts';

/**
 * Stack Jump 3D — implémentation fidèle au cahier des charges.
 * Remplace l'ancien mode "Survie 30s". Conserve la clé `bestScore_survie_60s`
 * pour préserver la compatibilité du classement.
 */

interface StackJump3DGameProps {
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
const PLATE_H = 0.35;
const BASE_SIZE = 2.2;
const TWIN_EVERY = 6;
const RED_DURATION = 2.5;
const BEST_KEY = 'bestScore_survie_60s';

type PlateKind = 'normal' | 'gold' | 'red' | 'twin';

function pickNextKind(score: number, twinCounter: number): PlateKind {
  if (score >= 4 && twinCounter >= TWIN_EVERY - 1) return 'twin';
  if (score < 4) return 'normal';
  const r = Math.random();
  if (r < 0.04) return 'gold';
  if (r < 0.22) return 'red';
  return 'normal';
}

function addPlate(group: THREE.Group, size: number, color: THREE.Color | string, topAccent: number) {
  const colorObj = color instanceof THREE.Color ? color : new THREE.Color(color);
  const geom = new THREE.BoxGeometry(size, PLATE_H, size);
  // Flat, vivid sides (no emissive — keep the clean cartoon look from the reference)
  const mat = new THREE.MeshBasicMaterial({ color: colorObj });
  const mesh = new THREE.Mesh(geom, mat);
  group.add(mesh);

  // Pure white top face (slightly inset)
  const topGeo = new THREE.PlaneGeometry(size * 0.995, size * 0.995);
  const topMat = new THREE.MeshBasicMaterial({ color: topAccent });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.rotation.x = -Math.PI / 2;
  topMesh.position.y = PLATE_H / 2 + 0.002;
  mesh.add(topMesh);

  // Crisp white outline (cartoon edge)
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
  );
  mesh.add(edges);

  return mesh;
}




function makeBurst(group: THREE.Group, x: number, y: number, color: number, scaleMax: number) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.6, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, y + PLATE_H / 2 + 0.01, 0);
  group.add(ring);
  return { mesh: ring, life: 0, maxLife: 0.7, scaleMax };
}

interface Plate { x: number; y: number; size: number; }
interface Moving { x: number; size: number; dir: number; }
interface Burst { mesh: THREE.Mesh; life: number; maxLife: number; scaleMax: number; }

interface SceneProps {
  cmdRef: React.MutableRefObject<{ drop: boolean }>;
  onScore: (s: number) => void;
  onDie: (s: number) => void;
  onMsg: (msg: { kind: string; key: number } | null) => void;
  onRedWarn: (v: boolean) => void;
  playing: boolean;
}

const Scene: React.FC<SceneProps> = ({ cmdRef, onScore, onDie, onMsg, onRedWarn, playing }) => {
  const { camera } = useThree();
  const stackRef = useRef<THREE.Group>(null);
  const movingRef = useRef<THREE.Mesh>(null);
  const twinRef = useRef<THREE.Mesh>(null);
  const guideRef = useRef<THREE.Mesh>(null);
  const camY = useRef(2);
  const msgKey = useRef(0);

  const state = useRef({
    stack: [] as Plate[],
    moving: { x: -3.2, size: BASE_SIZE, dir: 1 } as Moving,
    kind: 'normal' as PlateKind,
    twinCounter: 0,
    score: 0,
    elapsed: 0,
    dead: false,
    redTimer: 0,
    bursts: [] as Burst[],
  });

  // Setup — only (re)initialize when a new game starts (playing becomes true)
  useEffect(() => {
    if (!playing) return;
    const g = stackRef.current!;
    // clear
    while (g.children.length) {
      const c = g.children[0];
      g.remove(c);
      if ((c as any).geometry) (c as any).geometry.dispose?.();
      if ((c as any).material) (c as any).material.dispose?.();
    }
    state.current.stack = [];
    state.current.score = 0;
    state.current.elapsed = 0;
    state.current.dead = false;
    state.current.twinCounter = 0;
    state.current.kind = 'normal';
    state.current.redTimer = 0;
    state.current.bursts = [];
    camY.current = 2;

    // Initial cyan plate
    const initColor = new THREE.Color('#22d3ee');
    const base = addPlate(g, BASE_SIZE, initColor, 0xffffff);
    base.position.set(0, 0, 0);
    state.current.stack.push({ x: 0, y: 0, size: BASE_SIZE });
    state.current.moving = { x: -3.2, size: BASE_SIZE, dir: 1 };

    // Style moving
    applyMovingMaterial('normal');
    onRedWarn(false);
    onScore(0);
  }, [playing]);

  const applyMovingMaterial = (kind: PlateKind) => {
    const m = movingRef.current;
    const tw = twinRef.current;
    if (!m) return;
    const colorMap: Record<PlateKind, string> = {
      normal: '#e879f9',
      gold: '#fde047',
      red: '#ef4444',
      twin: '#22d3ee',
    };
    const col = colorMap[kind];
    (m.material as THREE.MeshBasicMaterial).color.set(col);
    if (tw) (tw.material as THREE.MeshBasicMaterial).color.set(col);
  };


  const nextPlate = () => {
    const s = state.current;
    s.twinCounter++;
    const kind = pickNextKind(s.score, s.twinCounter);
    if (kind === 'twin') s.twinCounter = 0;
    s.kind = kind;
    s.redTimer = kind === 'red' ? RED_DURATION : 0;
    onRedWarn(kind === 'red');
    // Reposition moving from opposite side of last direction
    s.moving.x = s.moving.dir > 0 ? -3.2 : 3.2;
    applyMovingMaterial(kind);
  };

  useFrame((_, dt) => {
    if (!playing) return;
    const s = state.current;
    if (s.dead) return;
    dt = Math.min(dt, 0.05);
    s.elapsed += dt;

    // Red countdown
    if (s.kind === 'red') {
      s.redTimer -= dt;
      if (s.redTimer <= 0) {
        s.kind = 'normal';
        onRedWarn(false);
        applyMovingMaterial('normal');
      }
    }

    const speed = 2.2 + Math.min(s.score, 32) * 0.07;
    s.moving.x += speed * s.moving.dir * dt;
    if (s.moving.x > 3.2) { s.moving.x = 3.2; s.moving.dir = -1; }
    else if (s.moving.x < -3.2) { s.moving.x = -3.2; s.moving.dir = 1; }

    const top = s.stack[s.stack.length - 1];
    const movingY = top.y + PLATE_H;

    // Update guide
    if (guideRef.current) {
      guideRef.current.position.set(top.x, top.y + PLATE_H / 2 + 0.003, 0);
      guideRef.current.scale.set(top.size, 1, top.size);
      const mat = guideRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + 0.15 * Math.sin(s.elapsed * 4);
    }

    // Update moving meshes
    const m = movingRef.current;
    const tw = twinRef.current;
    if (m) {
      m.scale.set(s.moving.size, 1, s.moving.size);
      m.position.y = movingY;
      if (s.kind === 'twin' && tw) {
        const half = s.moving.size / 2;
        const gap = half * 0.55;
        const offset = s.moving.x;
        m.scale.set(half, 1, s.moving.size);
        m.position.x = top.x - offset - gap;
        tw.visible = true;
        tw.scale.set(half, 1, s.moving.size);
        tw.position.set(top.x + offset + gap, movingY, 0);
        m.scale.y = 1;
        tw.scale.y = 1;
      } else {
        if (tw) tw.visible = false;
        m.position.x = s.moving.x;
        m.scale.y = s.kind === 'red' ? 1 + 0.15 * Math.sin(s.elapsed * 12) : 1;
      }
    }

    // Handle drop command
    if (cmdRef.current.drop) {
      cmdRef.current.drop = false;
      handleDrop(movingY);
    }

    // Bursts update
    s.bursts = s.bursts.filter(b => {
      b.life += dt;
      const t = b.life / b.maxLife;
      const sc = 1 + t * (b.scaleMax - 1);
      b.mesh.scale.set(sc, sc, sc);
      const mat = b.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - t);
      if (t >= 1) {
        stackRef.current?.remove(b.mesh);
        b.mesh.geometry.dispose();
        (b.mesh.material as THREE.Material).dispose();
        return false;
      }
      return true;
    });

    // Camera orbit
    const baseAngle = Math.atan2(5, 6);
    const radius = 7.8;
    const angle = baseAngle + s.elapsed * 0.18;
    const targetY = top.y + 2.4;
    camY.current += (targetY - camY.current) * 0.07;
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = camY.current;
    camera.lookAt(0, camY.current - 1.5, 0);
  });

  const handleDrop = (movingY: number) => {
    const s = state.current;
    const top = s.stack[s.stack.length - 1];

    if (s.kind === 'red') {
      s.dead = true;
      msgKey.current++;
      onMsg({ kind: 'redDie', key: msgKey.current });
      onRedWarn(false);
      onDie(s.score);
      return;
    }

    let cx: number, dx: number;
    const movingSize = s.moving.size;
    if (s.kind === 'twin') {
      cx = top.x;
      dx = s.moving.x;
    } else {
      cx = s.moving.x;
      dx = s.moving.x - top.x;
    }
    const overlap = (movingSize + top.size) / 2 - Math.abs(dx);
    if (overlap <= 0.15) {
      s.dead = true;
      onDie(s.score);
      return;
    }
    const precision = 1 - Math.abs(dx) / Math.max(0.0001, top.size);
    let newSize: number, placedX: number;

    if (s.kind === 'gold') {
      newSize = BASE_SIZE;
      placedX = cx;
      msgKey.current++;
      onMsg({ kind: 'gold', key: msgKey.current });
      s.bursts.push(makeBurst(stackRef.current!, placedX, movingY, 0xfde047, 4.5));
    } else if (precision >= 0.94) {
      newSize = Math.min(BASE_SIZE, movingSize * 1.08);
      placedX = cx;
      if (newSize > movingSize + 0.001) {
        msgKey.current++;
        onMsg({ kind: 'grow', key: msgKey.current });
      } else {
        msgKey.current++;
        onMsg({ kind: 'perfect', key: msgKey.current });
      }
      s.bursts.push(makeBurst(stackRef.current!, placedX, movingY, 0x22d3ee, 3.8));
      s.bursts.push(makeBurst(stackRef.current!, placedX, movingY, 0xa855f7, 5.5));
    } else {
      newSize = Math.min(movingSize, overlap);
      const leftEdge = Math.max(top.x - top.size / 2, cx - movingSize / 2);
      const rightEdge = Math.min(top.x + top.size / 2, cx + movingSize / 2);
      placedX = (leftEdge + rightEdge) / 2;
    }

    const baseHsl = new THREE.Color().setHSL((0.7 + s.score * 0.04) % 1, 0.7, 0.6);
    const plateColor =
      s.kind === 'gold' ? new THREE.Color('#fde047') :
      s.kind === 'twin' ? new THREE.Color('#22d3ee') : baseHsl;
    const topAccent = s.kind === 'gold' ? 0xfff7c2 : 0xffffff;

    const mesh = addPlate(stackRef.current!, newSize, plateColor, topAccent);
    mesh.position.set(placedX, movingY, 0);

    s.stack.push({ x: placedX, y: movingY, size: newSize });
    s.moving.size = newSize;
    s.score += 1;
    onScore(s.score);
    nextPlate();
  };

  return (
    <>
      <ambientLight intensity={1} />
      <fog attach="fog" args={['#08041a', 22, 50]} />

      <group ref={stackRef} />

      {/* Guide */}
      <mesh ref={guideRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.5, 4, 1]} />
        <meshBasicMaterial color={0xfde047} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Moving plate (flat fuchsia with white top + white edges) */}
      <mesh ref={movingRef}>
        <boxGeometry args={[1, PLATE_H, 1]} />
        <meshBasicMaterial color="#e879f9" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PLATE_H / 2 + 0.002, 0]}>
          <planeGeometry args={[0.995, 0.995]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, PLATE_H, 1)]} />
          <lineBasicMaterial color={0xffffff} transparent opacity={0.95} />
        </lineSegments>
      </mesh>
      <mesh ref={twinRef} visible={false}>
        <boxGeometry args={[1, PLATE_H, 1]} />
        <meshBasicMaterial color="#22d3ee" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, PLATE_H / 2 + 0.002, 0]}>
          <planeGeometry args={[0.995, 0.995]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, PLATE_H, 1)]} />
          <lineBasicMaterial color={0xffffff} transparent opacity={0.95} />
        </lineSegments>
      </mesh>

      <BackgroundDecor />
    </>
  );
};

const BackgroundDecor: React.FC = () => {
  // Tiny stars scattered across the dark sky
  const stars = React.useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cPink = new THREE.Color('#e879f9');
    const cPurple = new THREE.Color('#a855f7');
    const cWhite = new THREE.Color('#ffffff');
    for (let i = 0; i < count; i++) {
      // Distribute around a wide back hemisphere
      const r = 14 + Math.random() * 16;
      const theta = (Math.random() - 0.5) * Math.PI; // front-facing arc
      const y = 1 + Math.random() * 18;
      positions[i * 3] = Math.sin(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -Math.abs(Math.cos(theta) * r) - 4;
      const pick = Math.random();
      const c = pick < 0.5 ? cPink : pick < 0.85 ? cPurple : cWhite;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  // Concentric racetrack-style curves on the floor (cyan + purple).
  // Off-centered to one side, like in the reference image.
  const lanes = [
    { r: 5.5, color: '#22d3ee' },
    { r: 6.8, color: '#a855f7' },
    { r: 8.2, color: '#22d3ee' },
    { r: 9.6, color: '#a855f7' },
    { r: 11.0, color: '#22d3ee' },
    { r: 12.5, color: '#a855f7' },
  ];

  return (
    <>
      {/* Subtle dark purple grid floor */}
      <gridHelper args={[60, 30, '#6d28d9', '#1a0b3a']} position={[0, -2.5, 0]} />

      {/* Concentric racetrack curves */}
      <group position={[6, -2.46, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        {lanes.map((l, i) => (
          <mesh key={i}>
            <torusGeometry args={[l.r, 0.05, 8, 96]} />
            <meshBasicMaterial color={l.color} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* Big dark purple sphere — top-left planet */}
      <mesh position={[-9, 10, -14]}>
        <sphereGeometry args={[5.5, 48, 32]} />
        <meshBasicMaterial color="#2a1257" />
      </mesh>

      {/* Tiny stars */}
      <points geometry={stars}>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </>
  );
};




export const StackJump3DGame: React.FC<StackJump3DGameProps> = ({
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
  const [msg, setMsg] = useState<{ kind: string; key: number } | null>(null);
  const [redWarn, setRedWarn] = useState(false);
  const cmdRef = useRef({ drop: false });
  const startedAt = useRef(0);
  const sceneKey = useRef(0);
  const offsetRef = useRef(0);
  const shieldRef = useRef(false);

  const handleStart = useCallback(() => {
    sceneKey.current++;
    offsetRef.current = menuBoosts.includes('start_20') ? 20 : 0;
    shieldRef.current = menuBoosts.includes('shield');
    onSetBoosts?.(menuBoosts);
    setScore(offsetRef.current);
    setMsg(null);
    setRedWarn(false);
    cmdRef.current.drop = false;
    startedAt.current = Date.now();
    setPhase('playing');
  }, [menuBoosts, onSetBoosts]);

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
      cmdRef.current.drop = false;
      setRedWarn(false);
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
    cmdRef.current.drop = false;
    setRedWarn(false);
    startedAt.current = Date.now();
    setPhase('playing');
  }, [score]);

  // Auto-dismiss msg
  useEffect(() => {
    if (!msg) return;
    const id = window.setTimeout(() => setMsg(null), 900);
    return () => window.clearTimeout(id);
  }, [msg]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'playing') return;
    e.preventDefault();
    cmdRef.current.drop = true;
  };

  const msgLabel = (() => {
    if (!msg) return '';
    switch (msg.kind) {
      case 'gold': return 'BONUS DORÉ — TAILLE RESTAURÉE';
      case 'grow': return 'PARFAIT +';
      case 'perfect': return 'PARFAIT';
      case 'redDie': return 'PIÈGE ROUGE !';
      default: return '';
    }
  })();

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
          onPointerDown={onPointerDown}
        >
          <GameCanvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [5, 2, 6], fov: 50, near: 0.1, far: 100 }}
            style={{ background: '#0a0518' }}
          >
            <Scene
              cmdRef={cmdRef}
              onScore={handleScore}
              onDie={handleDie}
              onMsg={setMsg}
              onRedWarn={setRedWarn}
              playing={phase === 'playing'}
            />
          </GameCanvas>

          {/* Red warning banner */}
          {phase === 'playing' && redWarn && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-red-600/85 text-white text-sm font-bold animate-pulse shadow-lg pointer-events-none">
              ⛔ Plaque rouge — NE PAS POSER
            </div>
          )}

          {/* Feedback message */}
          {phase === 'playing' && msg && (
            <div
              key={msg.key}
              className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-black/70 border border-primary/50 text-primary font-extrabold tracking-wider text-sm animate-scale-in pointer-events-none"
              style={{ top: '38%' }}
            >
              {msgLabel}
            </div>
          )}

          {/* Menu */}
          {phase === 'menu' && (
            <GameStartOverlay
              title="Stack Jump"
              titleGradient="from-purple-300 via-fuchsia-300 to-cyan-300"
              bestValue={best}
              currentMode={'survie_60s' as any}
              selectedBoosts={menuBoosts}
              onSelectedBoostsChange={setMenuBoosts}
              onStart={handleStart}
              rules={[
                { icon: <Hand className="w-4 h-4 text-fuchsia-300" />, title: 'Tap', desc: 'pose la plaque qui glisse au bon moment' },
                { icon: <Sparkles className="w-4 h-4 text-yellow-300" />, title: 'Or', desc: 'taille restaurée. Parfait = +8% de taille', accent: 'highlight' },
                { icon: <AlertTriangle className="w-4 h-4 text-red-400" />, title: 'Rouge', desc: 'piège ! Attends 2.5s qu\'elle redevienne normale', accent: 'danger' },
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

export default StackJump3DGame;
