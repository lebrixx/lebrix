import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GameCanvas } from '@/components/GameCanvas';
import * as THREE from 'three';

/**
 * Décor 3D identique à celui du mode Ball Balance, utilisé comme fond du menu principal.
 * Purement décoratif : pointer-events désactivés, aucun contenu au premier plan.
 */
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
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
            count={particles.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#22d3ee"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <group ref={orbsGroupRef}>
        {orbs.map((o, i) => (
          <mesh key={i} position={o.pos}>
            <sphereGeometry args={[o.r, 16, 12]} />
            <meshBasicMaterial
              color={o.color}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <gridHelper args={[80, 40, '#7c3aed', '#1a0f33']} position={[0, -3, -30]} />
    </group>
  );
};

const Scene: React.FC = () => {
  return (
    <>
      <fog attach="fog" args={['#0a0518', 14, 30]} />
      <color attach="background" args={['#0a0518']} />
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 6, 3]} color="#a855f7" intensity={1.3} />
      <pointLight position={[0, 2, 0]} color="#22d3ee" intensity={0.7} />
      <gridHelper args={[40, 20, '#3b1f6a', '#1a0f33']} position={[0, -1.2, -10]} />
      <BackgroundDecor />
    </>
  );
};

export const MainMenuBackground: React.FC = () => {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#0a0518' }}
    >
      <GameCanvas
        camera={{ position: [0, 1.5, 4], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene />
      </GameCanvas>
    </div>
  );
};
