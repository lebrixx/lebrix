import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, RotateCcw, Play, Hand, Shield, Zap } from 'lucide-react';
import { GameStartOverlay } from '@/components/GameStartOverlay';
import { BoostType } from '@/types/boosts';

/**
 * Rotating Cube — implémentation fidèle au cahier des charges.
 * Conserve la clé `bestScore_memoire_expert` pour préserver le classement.
 */

interface RotatingCube3DGameProps {
  onBack?: () => void;
  onGameOver?: (score: number, gameDuration: number) => void;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  playSuccess?: (combo?: number) => void;
  playFailure?: () => void;
  selectedBoosts?: string[];
  onSetBoosts?: (b: BoostType[]) => void;
}

const BEST_KEY = 'bestScore_memoire_expert';
const GRID = 4;
const CELL = 0.9;

type WaveKind = 'row' | 'col' | 'diag' | 'anti' | 'border' | 'inner' | 'cluster';
interface Wave {
  kind: WaveKind;
  index: number;
  cells?: [number, number][];
  phase: 'warn' | 'danger' | 'done';
  timer: number;
  sig: string;
}

interface SwipeProps {
  onSwipe: (dir: 'left' | 'right' | 'up' | 'down') => void;
  children: React.ReactNode;
}

const SwipeArea: React.FC<SwipeProps> = ({ onSwipe, children }) => {
  const startRef = useRef<{ x: number; y: number; fired: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, fired: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (!s || s.fired) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    s.fired = true;
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
    else onSwipe(dy > 0 ? 'down' : 'up');
  };
  const onUp = () => { startRef.current = null; };
  return (
    <div
      className="absolute inset-0 touch-none select-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {children}
    </div>
  );
};

// Background decor (stars + halos)
const BackgroundDecor: React.FC = () => {
  const ref = useRef<THREE.Points>(null);
  const geom = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    const N = 220;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.02; });
  return (
    <>
      <points ref={ref} geometry={geom}>
        <pointsMaterial color="#a855f7" size={0.06} transparent opacity={0.8} depthWrite={false} />
      </points>
      <mesh position={[-8, 3, -6]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.08} />
      </mesh>
      <mesh position={[8, -2, -5]}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </mesh>
    </>
  );
};

interface SceneProps {
  posRef: React.MutableRefObject<{ i: number; j: number }>;
  cmdRef: React.MutableRefObject<{ dir: 'left' | 'right' | 'up' | 'down' | null }>;
  onScore: (n: number) => void;
  onDie: (final: number) => void;
  onShields: (n: number) => void;
  playing: boolean;
}

const Scene: React.FC<SceneProps> = ({ posRef, cmdRef, onScore, onDie, onShields, playing }) => {
  const { scene } = useThree();

  const cubeRef = useRef<THREE.Group>(null);
  const playerRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const cellsRef = useRef<THREE.Mesh[][]>([]);
  const bonusGroupRef = useRef<THREE.Group>(null);

  const state = useRef({
    elapsed: 0,
    spawn: 0,
    bonusSpawn: 0,
    waves: [] as Wave[],
    lastSig: '',
    prevSig: '',
    survived: 0,
    lastReported: 0,
    shields: 0,
    dead: false,
    bonus: null as null | { i: number; j: number; mesh: THREE.Mesh; timer: number },
  });

  // Build cells
  useEffect(() => {
    if (!cubeRef.current) return;
    const cells: THREE.Mesh[][] = [];
    for (let i = 0; i < GRID; i++) {
      cells[i] = [];
      for (let j = 0; j < GRID; j++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(CELL * 0.92, 0.05, CELL * 0.92),
          new THREE.MeshBasicMaterial({ color: 0x2a1a55 })
        );
        m.position.set((i - 1.5) * CELL, 0, (j - 1.5) * CELL);
        cubeRef.current.add(m);
        cells[i][j] = m;
      }
    }
    cellsRef.current = cells;
    return () => {
      cells.flat().forEach(m => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
        cubeRef.current?.remove(m);
      });
    };
  }, []);

  const cellsOf = (w: Wave): [number, number][] => {
    const out: [number, number][] = [];
    switch (w.kind) {
      case 'row': for (let j = 0; j < GRID; j++) out.push([w.index, j]); break;
      case 'col': for (let i = 0; i < GRID; i++) out.push([i, w.index]); break;
      case 'diag': for (let n = 0; n < GRID; n++) out.push([n, n]); break;
      case 'anti': for (let n = 0; n < GRID; n++) out.push([n, GRID - 1 - n]); break;
      case 'border':
        for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++)
          if (i === 0 || j === 0 || i === GRID - 1 || j === GRID - 1) out.push([i, j]);
        break;
      case 'inner':
        for (let i = 1; i <= GRID - 2; i++) for (let j = 1; j <= GRID - 2; j++) out.push([i, j]);
        break;
      case 'cluster': return w.cells || [];
    }
    return out;
  };

  const onWaveAt = (w: Wave, i: number, j: number): boolean => {
    return cellsOf(w).some(([a, b]) => a === i && b === j);
  };

  const buildCluster = (): { cells: [number, number][]; sig: string } => {
    const templates: [number, number][][] = [
      [[0, 0], [1, 0], [0, 1]],
      [[0, 0], [1, 0], [2, 0], [1, 1]],
      [[0, 0], [1, 1], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1]],
    ];
    const t = templates[Math.floor(Math.random() * templates.length)];
    const rot = Math.floor(Math.random() * 4);
    let pts = t.map(([x, y]) => [x, y] as [number, number]);
    for (let r = 0; r < rot; r++) pts = pts.map(([x, y]) => [y, -x] as [number, number]);
    const xs = pts.map(p => p[0]);
    const ys = pts.map(p => p[1]);
    const minI = Math.min(...xs), maxI = Math.max(...xs);
    const minJ = Math.min(...ys), maxJ = Math.max(...ys);
    const w = maxI - minI + 1, h = maxJ - minJ + 1;
    const ox = Math.floor(Math.random() * (GRID - w + 1)) - minI;
    const oy = Math.floor(Math.random() * (GRID - h + 1)) - minJ;
    const cells = pts.map(([x, y]) => [x + ox, y + oy] as [number, number]);
    const sig = 'cluster:' + cells.map(c => `${c[0]},${c[1]}`).sort().join('|');
    return { cells, sig };
  };

  const pickWave = (): Wave => {
    for (let tries = 0; tries < 8; tries++) {
      const r = Math.random();
      let kind: WaveKind;
      if (r < 0.18) kind = 'cluster';
      else if (r < 0.24) kind = 'border';
      else if (r < 0.31) kind = 'inner';
      else if (r < 0.43) kind = 'diag';
      else if (r < 0.55) kind = 'anti';
      else if (r < 0.78) kind = 'row';
      else kind = 'col';
      let index = 0;
      let cells: [number, number][] | undefined;
      let sig = '';
      if (kind === 'cluster') {
        const c = buildCluster();
        cells = c.cells; sig = c.sig;
      } else if (kind === 'row' || kind === 'col' || kind === 'diag' || kind === 'anti') {
        index = Math.floor(Math.random() * GRID);
        sig = `${kind}:${index}`;
      } else {
        sig = `${kind}:0`;
      }
      if (sig !== state.current.lastSig && sig !== state.current.prevSig) {
        return { kind, index, cells, phase: 'warn', timer: 0, sig };
      }
    }
    // fallback
    const index = Math.floor(Math.random() * GRID);
    return { kind: 'row', index, phase: 'warn', timer: 0, sig: `row:${index}` };
  };

  useFrame((_, dt) => {
    if (!playing) return;
    const s = state.current;
    if (s.dead) return;

    s.elapsed += dt;
    s.spawn += dt;
    s.bonusSpawn += dt;

    // Handle swipe command
    if (cmdRef.current.dir) {
      const d = cmdRef.current.dir;
      cmdRef.current.dir = null;
      const p = posRef.current;
      if (d === 'left') p.i = Math.max(0, p.i - 1);
      else if (d === 'right') p.i = Math.min(GRID - 1, p.i + 1);
      else if (d === 'up') p.j = Math.max(0, p.j - 1);
      else if (d === 'down') p.j = Math.min(GRID - 1, p.j + 1);
    }

    const diff = 1 + s.elapsed / 55;
    const interval = Math.max(1.0, 1.9 / diff);
    const warnTime = Math.max(0.95, 1.55 / diff);
    const maxConcurrent = 2;
    const activeCount = s.waves.filter(w => w.phase !== 'done').length;

    if (s.spawn > interval && activeCount < maxConcurrent) {
      s.spawn = 0;
      const w = pickWave();
      w.timer = warnTime;
      s.waves.push(w);
      s.prevSig = s.lastSig;
      s.lastSig = w.sig;
    }

    const player = posRef.current;

    for (const w of s.waves) {
      if (w.phase === 'done') continue;
      w.timer -= dt;
      if (w.phase === 'warn') {
        if (w.timer <= 0) { w.phase = 'danger'; w.timer = 0.55; }
      } else if (w.phase === 'danger') {
        if (onWaveAt(w, player.i, player.j) && w.timer > 0.35) {
          if (s.shields > 0) {
            s.shields -= 1;
            onShields(s.shields);
            w.phase = 'done';
            s.survived += 1;
          } else {
            s.dead = true;
            onDie(s.survived);
            return;
          }
        } else if (w.timer <= 0) {
          w.phase = 'done';
          s.survived += 1;
        }
      }
    }

    // Repaint cells
    const cells = cellsRef.current;
    if (cells.length) {
      for (let i = 0; i < GRID; i++)
        for (let j = 0; j < GRID; j++)
          (cells[i][j].material as THREE.MeshBasicMaterial).color.setHex(0x2a1a55);
      for (const w of s.waves) {
        if (w.phase === 'done') continue;
        const col = w.phase === 'warn' ? 0xfbbf24 : 0xff2244;
        for (const [i, j] of cellsOf(w)) {
          if (cells[i] && cells[i][j])
            (cells[i][j].material as THREE.MeshBasicMaterial).color.setHex(col);
        }
      }
    }

    s.waves = s.waves.filter(w => w.phase !== 'done');

    if (s.survived !== s.lastReported) {
      s.lastReported = s.survived;
      onScore(s.survived);
    }

    // Bonus spawn
    if (s.bonusSpawn > 38 && !s.bonus && bonusGroupRef.current) {
      s.bonusSpawn = 0;
      const i = Math.floor(Math.random() * GRID);
      const j = Math.floor(Math.random() * GRID);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 0.55, 0.18, CELL * 0.55),
        new THREE.MeshBasicMaterial({ color: 0x4ade80 })
      );
      mesh.position.set((i - 1.5) * CELL, 0.15, (j - 1.5) * CELL);
      bonusGroupRef.current.add(mesh);
      s.bonus = { i, j, mesh, timer: 3.0 };
    }
    if (s.bonus) {
      s.bonus.timer -= dt;
      s.bonus.mesh.rotation.y += dt * 3;
      const collected = s.bonus.i === player.i && s.bonus.j === player.j && s.bonus.timer > 0;
      if (collected) {
        s.shields = Math.min(2, s.shields + 1);
        onShields(s.shields);
      }
      if (collected || s.bonus.timer <= 0) {
        bonusGroupRef.current?.remove(s.bonus.mesh);
        s.bonus.mesh.geometry.dispose();
        (s.bonus.mesh.material as THREE.Material).dispose();
        s.bonus = null;
      }
    }

    // Move player visual
    if (playerRef.current) {
      playerRef.current.position.x = (player.i - 1.5) * CELL;
      playerRef.current.position.z = (player.j - 1.5) * CELL;
      playerRef.current.position.y = 0.3;
    }

    // Shield aura
    if (shieldRef.current) {
      shieldRef.current.visible = s.shields > 0;
      if (s.shields > 0 && playerRef.current) {
        shieldRef.current.position.set(playerRef.current.position.x, 0.32, playerRef.current.position.z);
        const pulse = 1 + 0.08 * Math.sin(s.elapsed * 6);
        const base = s.shields === 2 ? 1.15 : 1.0;
        shieldRef.current.scale.set(pulse * base, 1, pulse * base);
        shieldRef.current.rotation.y += dt * 1.5;
        (shieldRef.current.material as THREE.MeshBasicMaterial).opacity = s.shields === 2 ? 0.85 : 0.6;
      }
    }
  });

  return (
    <>
      <fog attach="fog" args={['#0a0518', 12, 30]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 8, 5]} color="#a855f7" intensity={1.2} />
      <BackgroundDecor />

      {/* Plateau base */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[GRID * CELL + 0.4, 0.15, GRID * CELL + 0.4]} />
        <meshBasicMaterial color="#1a1033" />
      </mesh>

      <group ref={cubeRef} />
      <group ref={bonusGroupRef} />

      {/* Joueur */}
      <mesh ref={playerRef} position={[(posRef.current.i - 1.5) * CELL, 0.3, (posRef.current.j - 1.5) * CELL]}>
        <boxGeometry args={[CELL * 0.6, 0.4, CELL * 0.6]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Bouclier */}
      <mesh ref={shieldRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[CELL * 0.45, 0.04, 12, 32]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.6} />
      </mesh>
    </>
  );
};

export const RotatingCube3DGame: React.FC<RotatingCube3DGameProps> = ({
  onBack, onGameOver, isSoundMuted, onToggleSound, playSuccess, playFailure, selectedBoosts, onSetBoosts,
}) => {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(0);
  const [menuBoosts, setMenuBoosts] = useState<BoostType[]>(() => (selectedBoosts || []) as BoostType[]);
  useEffect(() => { setMenuBoosts((selectedBoosts || []) as BoostType[]); }, [selectedBoosts]);
  const [best, setBest] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('luckyStopGame') || '{}');
      return saved[BEST_KEY] || 0;
    } catch { return 0; }
  });

  const posRef = useRef({ i: 1, j: 1 });
  const cmdRef = useRef<{ dir: 'left' | 'right' | 'up' | 'down' | null }>({ dir: null });
  const sceneKey = useRef(0);
  const startedAt = useRef(0);
  const offsetRef = useRef(0);
  const shieldRef = useRef(false);

  const handleStart = useCallback(() => {
    posRef.current = { i: 1, j: 1 };
    cmdRef.current.dir = null;
    sceneKey.current++;
    offsetRef.current = menuBoosts.includes('start_20') ? 20 : 0;
    shieldRef.current = menuBoosts.includes('shield');
    onSetBoosts?.(menuBoosts);
    setScore(offsetRef.current);
    setShields(0);
    startedAt.current = Date.now();
    setPhase('playing');
  }, [menuBoosts, onSetBoosts]);

  const handleScore = useCallback((n: number) => {
    setScore(offsetRef.current + n);
    if (n > 0) playSuccess?.();
  }, [playSuccess]);

  const handleDie = useCallback((finalRaw: number) => {
    const finalScore = offsetRef.current + finalRaw;
    if (shieldRef.current) {
      shieldRef.current = false;
      offsetRef.current = finalScore;
      sceneKey.current++;
      posRef.current = { i: 1, j: 1 };
      cmdRef.current.dir = null;
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

  const handleSwipe = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (phase !== 'playing') return;
    cmdRef.current.dir = dir;
  };

  return (
    <div className="min-h-screen bg-gradient-game flex flex-col">
      <div className="flex items-center justify-between p-4 z-20 relative">
        <Button variant="outline" size="sm" onClick={onBack} className="border-wheel-border">
          <ArrowLeft className="w-4 h-4 mr-1" /> Menu
        </Button>
        <div className="text-right flex items-center gap-3">
          {shields > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/15 border border-green-400/40">
              <Shield className="w-4 h-4 text-green-300" />
              <span className="text-green-200 font-bold text-sm">×{shields}</span>
            </div>
          )}
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Score</div>
            <div className="text-3xl font-bold text-primary tabular-nums">{score}</div>
          </div>
        </div>
        {onToggleSound && (
          <Button variant="outline" size="sm" onClick={onToggleSound} className="border-wheel-border">
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 relative mx-3 mb-3 rounded-2xl overflow-hidden border border-border bg-black">
        <SwipeArea onSwipe={handleSwipe}>
          <Canvas
            key={sceneKey.current}
            dpr={[1, 2]}
            camera={{ position: [0, 6.2, 5.5], fov: 50, near: 0.1, far: 100 }}
            style={{ background: '#0a0518' }}
            onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
          >
            <Scene
              posRef={posRef}
              cmdRef={cmdRef}
              onScore={handleScore}
              onDie={handleDie}
              onShields={setShields}
              playing={phase === 'playing'}
            />
          </Canvas>
        </SwipeArea>

        {phase === 'menu' && (
          <GameStartOverlay
            title="Rotating Cube"
            titleGradient="from-purple-300 via-fuchsia-300 to-cyan-300"
            bestValue={best}
            currentMode={'memoire_expert' as any}
            selectedBoosts={menuBoosts}
            onSelectedBoostsChange={setMenuBoosts}
            onStart={handleStart}
            hideBoosts
            rules={[
              { icon: <Hand className="w-4 h-4 text-fuchsia-300" />, title: 'Swipe', desc: '↑ ↓ ← → pour bouger d\'une case' },
              { icon: <Zap className="w-4 h-4 text-yellow-300" />, title: 'Jaune / Rouge', desc: 'warning puis danger ! Quitte la case', accent: 'danger' },
              { icon: <Shield className="w-4 h-4 text-green-300" />, title: 'Pastille verte', desc: '+1 bouclier (max 2)', accent: 'highlight' },
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
  );
};

export default RotatingCube3DGame;
