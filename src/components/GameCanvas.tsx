import React, { useEffect, useRef, useState } from 'react';
import { Canvas, CanvasProps } from '@react-three/fiber';

/**
 * Wrapper autour de <Canvas> qui :
 *  - fixe des options WebGL raisonnables (moins de crash au lancement)
 *  - remonte automatiquement la scène en cas de perte du contexte WebGL
 *    (évite le "crash" quand on lance un mode juste après un autre)
 */
export function GameCanvas({ children, gl, onCreated, ...rest }: CanvasProps) {
  const [restartKey, setRestartKey] = useState(0);
  const restartTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (restartTimer.current) window.clearTimeout(restartTimer.current);
    };
  }, []);

  return (
    <Canvas
      key={restartKey}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        ...(gl as object),
      }}
      onCreated={(state) => {
        const canvas = state.gl.domElement;
        const handleLost = (e: Event) => {
          e.preventDefault();
          if (restartTimer.current) window.clearTimeout(restartTimer.current);
          restartTimer.current = window.setTimeout(() => {
            setRestartKey((k) => k + 1);
          }, 150);
        };
        canvas.addEventListener('webglcontextlost', handleLost as EventListener, false);
        onCreated?.(state);
      }}
      {...rest}
    >
      {children}
    </Canvas>
  );
}
