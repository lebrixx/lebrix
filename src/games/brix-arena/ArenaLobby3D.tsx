import { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import heroUrl from "@/assets/brix-arena/hero-run.png";
import meleeUrl from "@/assets/brix-arena/melee-run.png";
import tankUrl from "@/assets/brix-arena/tank-run.png";
import shooterUrl from "@/assets/brix-arena/shooter-run.png";

// Sprite sheets are 8x8 baked views of the original 3D models: rows = 8 facings, cols = 8 frames.
const CELLS = 8;
const ROW_ORDER = [2, 3, 4, 5, 6, 7, 0, 1]; // S, SW, W, NW, N, NE, E, SE: turntable sweep

function Actor({ url, position, size, fps, spin, phase = 0, hover = 0 }: { url: string; position: [number, number, number]; size: number; fps: number; spin: number; phase?: number; hover?: number }) {
  const base = useLoader(THREE.TextureLoader, url);
  const tex = useMemo(() => { const t = base.clone(); t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / CELLS, 1 / CELLS); t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; }, [base]);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = clock.elapsedTime + phase;
    const frame = Math.floor(s * fps) % CELLS;
    // Hold front-facing longer, then sweep around like a showroom turntable.
    const sweep = (s * spin) % 1.6;
    const row = sweep < 0.6 ? 2 : ROW_ORDER[Math.floor(((sweep - 0.6) / 1) * CELLS) % CELLS];
    tex.offset.set(frame / CELLS, 1 - (row + 1) / CELLS);
    if (mesh.current) mesh.current.position.y = position[1] + size * 0.42 + (hover ? Math.sin(s * 2.4) * hover : 0);
  });
  return <mesh ref={mesh} position={[position[0], position[1] + size * 0.42, position[2]]}>
    <planeGeometry args={[size, size]} />
    <meshBasicMaterial map={tex} transparent alphaTest={0.08} toneMapped={false} />
  </mesh>;
}

function Pedestal({ x, z, r, color }: { x: number; z: number; r: number; color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (ring.current) ring.current.rotation.z = clock.elapsedTime * 0.6; });
  return <group position={[x, 0, z]}>
    <mesh position={[0, 0.12, 0]} castShadow receiveShadow><cylinderGeometry args={[r, r * 1.12, 0.24, 48]} /><meshStandardMaterial color="#2c2b26" metalness={0.6} roughness={0.35} /></mesh>
    <mesh position={[0, 0.245, 0]}><cylinderGeometry args={[r * 0.94, r * 0.94, 0.01, 48]} /><meshStandardMaterial color="#3d3b33" metalness={0.3} roughness={0.6} /></mesh>
    <mesh ref={ring} position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.96, r * 1.02, 48, 1, 0, Math.PI * 1.5]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
  </group>;
}

function Rig() {
  useFrame(({ camera, clock }) => { const t = clock.elapsedTime * 0.25; camera.position.x = Math.sin(t) * 0.5; camera.position.y = 2.1 + Math.sin(t * 1.3) * 0.08; camera.lookAt(0, 0.9, 0); });
  return null;
}

export default function ArenaLobby3D() {
  return <Canvas className="arena-lobby-canvas" dpr={[1, 1.75]} camera={{ position: [0, 2.1, 6.2], fov: 38 }} gl={{ antialias: true, alpha: true }}
    onCreated={({ gl }) => { gl.domElement.parentElement?.setAttribute("data-scene-ready", "true"); }}>
    <ambientLight intensity={0.5} />
    <directionalLight position={[3, 6, 4]} intensity={1.4} />
    <pointLight position={[0, 2.5, 1.5]} intensity={6} color="#e8d27a" distance={7} />
    <Environment resolution={64}><Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} /><Lightformer intensity={1} color="#ffd98a" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} /></Environment>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[9, 64]} /><meshStandardMaterial color="#1d1c18" metalness={0.4} roughness={0.55} /></mesh>
    <Pedestal x={0} z={0.4} r={0.95} color="#e8c547" />
    <Pedestal x={-2.25} z={-0.4} r={0.62} color="#ff6b4a" />
    <Pedestal x={2.25} z={-0.4} r={0.62} color="#4ad3ff" />
    <Pedestal x={-1.25} z={-1.5} r={0.5} color="#ff6b4a" />
    <Actor url={heroUrl} position={[0, 0.25, 0.4]} size={2.3} fps={9} spin={0.35} />
    <Actor url={tankUrl} position={[-2.25, 0.25, -0.4]} size={1.9} fps={7} spin={0.3} phase={1.1} />
    <Actor url={shooterUrl} position={[2.25, 0.55, -0.4]} size={1.5} fps={12} spin={0.3} phase={2.3} hover={0.08} />
    <Actor url={meleeUrl} position={[-1.25, 0.25, -1.5]} size={1.3} fps={10} spin={0.4} phase={0.6} />
    <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={12} blur={2.4} far={3} />
    <Rig />
  </Canvas>;
}
