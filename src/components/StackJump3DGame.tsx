import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, AlertTriangle, Sparkles } from 'lucide-react';

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
  const mat = new THREE.MeshStandardMaterial({
    color: colorObj,
    emissive: colorObj.clone().multiplyScalar(0.35),
    roughness: 0.4,
    metalness: 0.25,
  });
  const mesh = new THREE.Mesh(geom, mat);
  group.add(mesh);

  // Top accent
  const topGeo = new THREE.BoxGeometry(size * 0.98, 0.04, size * 0.98);
  const topMat = new THREE.MeshStandardMaterial({
    color: topAccent,
    emissive: topAccent,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = PLATE_H / 2 + 0.02;
  mesh.add(topMesh);

  // Edges
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
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

  // Setup
  useEffect(() => {
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
  }, [playing]); // re-init on each play

  const applyMovingMaterial = (kind: PlateKind) => {
    const m = movingRef.current;
    const tw = twinRef.current;
    if (!m) return;
    const colorMap: Record<PlateKind, [string, string]> = {
      normal: ['#e879f9', '#d946ef'],
      gold: ['#fde047', '#facc15'],
      red: ['#ef4444', '#b91c1c'],
      twin: ['#22d3ee', '#0891b2'],
    };
    const [col, emi] = colorMap[kind];
    const mat = m.material as THREE.MeshStandardMaterial;
    mat.color.set(col);
    mat.emissive.set(emi);
    mat.emissiveIntensity = 0.5;
    if (tw) {
      const matT = tw.material as THREE.MeshStandardMaterial;
      matT.color.set(col);
      matT.emissive.set(emi);
      matT.emissiveIntensity = 0.5;
    }
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
      <ambientLight intensity={0.45} />
      <pointLight position={[6, 8, 5]} intensity={1.2} color="#a855f7" />
      <pointLight position={[-6, 6, -4]} intensity={1.0} color="#22d3ee" />
      <fog attach="fog" args={['#0a0518', 14, 32]} />

      <group ref={stackRef} />

      {/* Guide */}
      <mesh ref={guideRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.5, 4, 1]} />
        <meshBasicMaterial color={0xfde047} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Moving plate */}
      <mesh ref={movingRef}>
        <boxGeometry args={[1, PLATE_H, 1]} />
        <meshStandardMaterial color="#e879f9" emissive="#d946ef" emissiveIntensity={0.5} roughness={0.4} metalness={0.25} />
      </mesh>
      <mesh ref={twinRef} visible={false}>
        <boxGeometry args={[1, PLATE_H, 1]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0891b2" emissiveIntensity={0.5} roughness={0.4} metalness={0.25} />
      </mesh>

      {/* Background decor: grid + orb */}
      <gridHelper args={[60, 30, '#7c3aed', '#1a0f33']} position={[0, -2.5, 0]} />
      <mesh position={[6, 8, -8]}>
        <sphereGeometry args={[2.2, 24, 16]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.25} />
      </mesh>
      <mesh position={[-7, 4, -10]}>
        <sphereGeometry args={[1.5, 24, 16]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>
    </>
  );
};

export const StackJump3DGame: React.FC<StackJump3DGameProps> = ({
  onBack, onGameOver, isSoundMuted, onToggleSound, playSuccess, playFailure,
}) => {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
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

  const handleStart = useCallback(() => {
    sceneKey.current++;
    setScore(0);
    setMsg(null);
    setRedWarn(false);
    cmdRef.current.drop = false;
    startedAt.current = Date.now();
    setPhase('playing');
  }, []);

  const handleScore = useCallback((s: number) => {
    setScore(s);
    if (s > 0) playSuccess?.();
  }, [playSuccess]);

  const handleDie = useCallback((finalScore: number) => {
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
          <Canvas
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
          </Canvas>

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
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0518]/85 via-[#1a0a3a]/80 to-[#0a0518]/90 backdrop-blur-md">
              <div className="relative text-center max-w-sm px-6 py-8 mx-4 rounded-3xl border border-primary/30 bg-gradient-to-b from-[#1a0a3a]/80 to-[#0a0518]/80 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)] overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-cyan-400/30 blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="inline-block mb-4 px-4 py-1 rounded-full border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 text-xs uppercase tracking-[0.2em] font-semibold">
                    Nouveau mode
                  </div>
                  <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-purple-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    Stack Jump 3D
                  </h2>
                  <p className="text-text-secondary mb-5 text-sm leading-relaxed">
                    Empile les plaques le plus haut possible. Tape au bon moment pour viser le centre !
                  </p>

                  <div className="space-y-2 mb-5 text-left">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-fuchsia-500/20">
                      <Hand className="w-5 h-5 text-fuchsia-300 shrink-0" />
                      <span className="text-xs text-text-secondary">Tape pour poser la plaque qui glisse.</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-yellow-500/20">
                      <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
                      <span className="text-xs text-text-secondary">Or = taille restaurée. Parfait = +8% de taille.</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/30 border border-red-500/20">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-xs text-text-secondary">Rouge = piège ! Attends 2.5s qu'elle redevienne normale.</span>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black/30 border border-primary/20">
                    <span className="text-xs uppercase tracking-wider text-text-muted">Record</span>
                    <span className="text-2xl font-bold tabular-nums bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                      {best}
                    </span>
                  </div>

                  <Button
                    onClick={handleStart}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 hover:scale-105 transition-transform shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] text-white font-bold py-6"
                  >
                    <Play className="w-5 h-5 mr-2 fill-white" /> Commencer
                  </Button>
                </div>
              </div>
            </div>
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
