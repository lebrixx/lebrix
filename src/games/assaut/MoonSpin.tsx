import { useEffect, useRef } from "react";
import moonTexture from "./assets/moon.jpg";
import earthTexture from "./assets/earth-realistic.jpg";

// Rotating moon decoration for the menu (client-only WebGL).
export function MoonSpin({ className, planet = 'moon' }: { className?: string; planet?: 'moon' | 'earth' }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;
    import("three").then((THREE) => {
      if (cancelled) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false }); } catch { return; }
      const size = el.clientWidth || 200;
      renderer.setPixelRatio(1); renderer.setSize(size, size);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20); camera.position.z = 4;
      const map = new THREE.TextureLoader().load(planet === 'earth' ? earthTexture : moonTexture); map.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.SphereGeometry(1, 32, 24);
      const mat = new THREE.MeshStandardMaterial({ map, bumpMap: planet === 'moon' ? map : null, bumpScale: 2, roughness: 1 });
      const moon = new THREE.Mesh(geo, mat); moon.rotation.z = 0.35; scene.add(moon);
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const sun = new THREE.DirectionalLight(0xffffff, 3); sun.position.set(planet === 'earth' ? 3 : -3, 1.5, 2); scene.add(sun);
      let raf = 0;
      let last = performance.now();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (document.hidden || now - last < 32) return;
        moon.rotation.y += Math.min((now - last) / 1000, 0.1) * 0.24;
        last = now; renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);
      stop = () => { cancelAnimationFrame(raf); renderer.dispose(); geo.dispose(); mat.dispose(); map.dispose(); renderer.domElement.remove(); };
    });
    return () => { cancelled = true; stop(); };
  }, [planet]);
  return <div ref={host} aria-hidden data-menu-planet={planet} className={className} />;
}
