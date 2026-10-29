import * as THREE from 'three';
import player from '../assets/f104.png';
import droneAsset from '../assets/enemy-drone.webp';
const drone = droneAsset;
import zigAsset from '../assets/enemy-zig.webp';
const zig = zigAsset;
import tankAsset from '../assets/enemy-tank.webp';
const tank = tankAsset;
import bossAsset from '../assets/boss-ufo.webp';
import ufoMesh from './ufo-mesh.json';
const boss = bossAsset;
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Asteroid } from './asteroids';
import type { MoonPass } from './moon';
import moonUrl from '../assets/moon.jpg';
import earthSkin from '../assets/earth-realistic.jpg';

type Actor = { x: number; y: number; r: number; vx: number; vy: number; kind: 'drone' | 'zig' | 'tank' | 'shooter' | 'boss' };
type Pilot = { x: number; y: number; bank: number; visible: boolean };
type Theme = { fg: string; ink: string; smoke: string; s: string };
const DEPTH = { pitch: 0.18, bank: 1.9, thickness: 0.045, starCount: 100, cameraTilt: 0.65, fov: 42, approachScale: 0.24 };

// Presentation-only: actor coordinates are read, never transformed in the simulation.
export function createGameDepth(width: number, height: number, theme: Theme) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' }); }
  catch { return null; }
  renderer.setSize(width, height); renderer.setPixelRatio(0.85);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0, 0); renderer.autoClear = false;
  const sampler = document.createElement('canvas'); sampler.width = 1; sampler.height = 1;
  const sample = sampler.getContext('2d', { willReadFrequently: true });
  const color = (value: string) => {
    if (!sample) return new THREE.Color();
    sample.clearRect(0, 0, 1, 1); sample.fillStyle = value; sample.fillRect(0, 0, 1, 1);
    const pixel = sample.getImageData(0, 0, 1, 1).data;
    return new THREE.Color().setRGB((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255, THREE.SRGBColorSpace);
  };
  const scene = new THREE.Scene();
  const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(DEPTH.fov / 2)));
  const camera = new THREE.PerspectiveCamera(DEPTH.fov, width / height, 1, distance * 4);
  camera.position.set(0, -distance * Math.sin(DEPTH.cameraTilt), distance * Math.cos(DEPTH.cameraTilt));
  camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  // Tilt the view, not the gameplay: unproject each original screen anchor onto
  // the drawing plane and compensate its local scale. Bullets and collisions
  // therefore still meet the exact same visible centres, even at the edges.
  const ray = new THREE.Raycaster();
  const drawingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const anchor = new THREE.Vector3(); const viewPoint = new THREE.Vector3(); const screenPoint = new THREE.Vector2();
  const place = (object: THREE.Object3D, x: number, y: number, w: number, h: number) => {
    ray.setFromCamera(screenPoint.set(x / width * 2 - 1, 1 - y / height * 2), camera);
    if (!ray.ray.intersectPlane(drawingPlane, anchor)) return;
    object.position.copy(anchor);
    viewPoint.copy(anchor).applyMatrix4(camera.matrixWorldInverse);
    const scale = -viewPoint.z / distance;
    object.scale.set(w * scale, h * scale / Math.cos(DEPTH.cameraTilt), h * scale);
  };
  const environmentSource = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentSource, 0.04, 0.1, 100, { size: 64 });
  scene.environment = environment.texture; scene.environmentIntensity = 0.7;
  environmentSource.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(color(theme.fg), color(theme.ink), 1.2));
  const key = new THREE.DirectionalLight(color(theme.fg), 2.3); key.position.set(-200, 300, 400); scene.add(key);
  const rim = new THREE.DirectionalLight(color(theme.s), 0.8); rim.position.set(250, -100, 150); scene.add(rim);
  const loader = new THREE.TextureLoader();
  const textures = Object.fromEntries(Object.entries({ player, drone, zig, tank, shooter: zig, boss }).map(([kind, url]) => {
    const texture = loader.load(url); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); return [kind, texture];
  })) as Record<Actor['kind'] | 'player', THREE.Texture>;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials = Object.fromEntries(Object.entries(textures).map(([kind, map]) => [kind, {
    top: new THREE.MeshStandardMaterial({ map, alphaTest: 0.15, roughness: kind === 'boss' ? 0.38 : 0.5, metalness: 0.35, side: THREE.DoubleSide }),
    side: new THREE.MeshStandardMaterial({ map, color: color(theme.smoke), alphaTest: 0.15, side: THREE.DoubleSide, roughness: 0.75 }),
  }])) as Record<Actor['kind'] | 'player', { top: THREE.MeshStandardMaterial; side: THREE.MeshStandardMaterial }>;
  const reliefs: Partial<Record<Actor['kind'] | 'player', THREE.PlaneGeometry>> = {};
  const relief = (kind: Actor['kind'] | 'player') => {
    const cached = reliefs[kind]; if (cached) return cached;
    const result = new THREE.PlaneGeometry(1, 1, 16, 22);
    const source = textures[kind].image;
    const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 96;
    const paint = canvas.getContext('2d', { willReadFrequently: true });
    if (paint && source instanceof HTMLImageElement && source.naturalWidth) {
      paint.drawImage(source, 0, 0, 96, 96);
      const pixels = paint.getImageData(0, 0, 96, 96).data;
      const vertices = result.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i), y = vertices.getY(i);
        const px = Math.max(0, Math.min(95, Math.round((x + 0.5) * 95)));
        const py = Math.max(0, Math.min(95, Math.round((0.5 - y) * 95)));
        const offset = (py * 96 + px) * 4;
        const brightness = ((pixels[offset] ?? 0) + (pixels[offset + 1] ?? 0) + (pixels[offset + 2] ?? 0)) / 765;
        const hull = Math.max(0, 1 - Math.pow(x * 2, 2)) * Math.max(0, 1 - Math.pow(y * 2, 2));
        vertices.setZ(i, hull * (0.02 + brightness * 0.045) * ((pixels[offset + 3] ?? 0) / 255));
      }
      result.computeVertexNormals();
    }
    reliefs[kind] = result; return result;
  };
  // Boss: the supplied low-poly UFO as a real mesh (unit width, up axis = +Z).
  const ufoParts = (Object.keys(ufoMesh) as (keyof typeof ufoMesh)[]).map((part) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(ufoMesh[part], 3)); g.computeVertexNormals();
    const m = part === 'glass'
      ? new THREE.MeshStandardMaterial({ color: 0x5fc8ea, roughness: 0.08, metalness: 0.2, emissive: 0x0d4a66, emissiveIntensity: 0.7, flatShading: true })
      : part === 'lights'
        ? new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff3a1e, emissiveIntensity: 1.4, roughness: 0.4, flatShading: true })
        : new THREE.MeshStandardMaterial({ color: 0xa9b1bf, roughness: 0.28, metalness: 0.85, flatShading: true });
    return { g, m };
  });
  const makeShip = (kind: Actor['kind'] | 'player') => {
    const group = new THREE.Group();
    if (kind === 'boss') {
      const spin = new THREE.Group();
      for (const { g, m } of ufoParts) spin.add(new THREE.Mesh(g, m));
      group.add(spin); scene.add(group); return group;
    }
    for (let layer = 1; layer < 4; layer += 2) {
      const mesh = new THREE.Mesh(geometry, layer === 3 ? materials[kind].top : materials[kind].side);
      mesh.position.z = (layer - 3) * DEPTH.thickness / 3; group.add(mesh);
    }
    scene.add(group); return group;
  };
  const hero = makeShip('player');
  const pools: Partial<Record<Actor['kind'], THREE.Group[]>> = {};
  const sky = new THREE.Scene();
  const skyCamera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
  const starPositions = new Float32Array(DEPTH.starCount * 3);
  for (let i = 0; i < DEPTH.starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 1400;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1800;
    starPositions[i * 3 + 2] = -250 - Math.random() * 1100;
  }
  const starsGeometry = new THREE.BufferGeometry(); starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: color(theme.fg), size: 1.8, transparent: true, opacity: 0.6, sizeAttenuation: true, depthWrite: false });
  sky.add(new THREE.Points(starsGeometry, starsMaterial));
  sky.add(new THREE.HemisphereLight(color(theme.fg), color(theme.ink), 2.5));
  const sun = new THREE.DirectionalLight(color(theme.fg), 4); sun.position.set(-300, 400, 200); sky.add(sun);
  // Crater texture on real faceted meshes, not flat decorative circles.
  const surface = document.createElement('canvas'); surface.width = 128; surface.height = 128;
  const paint = surface.getContext('2d');
  if (paint) {
    paint.fillStyle = theme.smoke; paint.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 130; i++) {
      const x = Math.random() * 128, y = Math.random() * 128, r = 1 + Math.random() * 8;
      paint.globalAlpha = 0.2 + Math.random() * 0.3; paint.fillStyle = i % 2 ? theme.ink : theme.fg;
      paint.beginPath(); paint.arc(x, y, r, 0, Math.PI * 2); paint.fill();
    }
  }
  const rockTexture = new THREE.CanvasTexture(surface); rockTexture.colorSpace = THREE.SRGBColorSpace;
  const rockMaterial = new THREE.MeshStandardMaterial({ map: rockTexture, roughness: 0.88, metalness: 0.08, flatShading: true });
  const rockGeometry = new THREE.IcosahedronGeometry(1, 1);
  const vertices = rockGeometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) { const scale = 0.85 + Math.sin(vertices.getX(i) * 9 + vertices.getY(i) * 7) * 0.15; vertices.setXYZ(i, vertices.getX(i) * scale, vertices.getY(i) * scale, vertices.getZ(i) * scale); }
  rockGeometry.computeVertexNormals();
  const moonScene = new THREE.Scene();
  const moonMap = loader.load(moonUrl); moonMap.colorSpace = THREE.SRGBColorSpace;
  const moonGeometry = new THREE.SphereGeometry(1, 32, 24);
  const moonMaterial = new THREE.MeshStandardMaterial({ map: moonMap, bumpMap: moonMap, bumpScale: 2, roughness: 1 });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial); moon.rotation.z = 0.35; moonScene.add(moon);
  const earthMap = loader.load(earthSkin); earthMap.colorSpace = THREE.SRGBColorSpace;
  const earthMaterial = new THREE.MeshStandardMaterial({ map: earthMap, roughness: 1 });
  const earth = new THREE.Mesh(moonGeometry, earthMaterial); earth.rotation.z = 0.35; moonScene.add(earth);
  moonScene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const moonSun = new THREE.DirectionalLight(0xffffff, 2.6); moonSun.position.set(-300, 250, 300); moonScene.add(moonSun);
  const rocks: THREE.Mesh[] = [];
  let disposed = false;
  let contextLost = false;
  renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); contextLost = true; });
  const imageOf = (texture: THREE.Texture): HTMLImageElement | null => texture.image instanceof HTMLImageElement ? texture.image : null;
  return {
    draw(ctx: CanvasRenderingContext2D, enemies: Actor[], pilot: Pilot, time: number, asteroids: Asteroid[], moonPass: MoonPass | null = null, earthPass: MoonPass | null = null) {
      if (disposed || contextLost || Object.values(textures).some(texture => !imageOf(texture)?.naturalWidth)) return false;
      for (const [kind, texture] of Object.entries(textures)) {
        if (imageOf(texture)?.naturalWidth) relief(kind as Actor['kind'] | 'player');
      }
      const counts: Partial<Record<Actor['kind'], number>> = {};
      for (const e of enemies) {
        const list = pools[e.kind] ?? (pools[e.kind] = []); const index = counts[e.kind] ?? 0; counts[e.kind] = index + 1;
        const group = list[index] ?? (list[index] = makeShip(e.kind)); group.visible = true;
        const image = imageOf(textures[e.kind]);
        if (!image) continue;
        // Distant aircraft begin smaller and reveal more of their hull as they
        // approach. Only the artwork changes; anchors and hitboxes stay fixed.
        const progress = THREE.MathUtils.clamp(e.y / (height * 0.8), 0, 1);
        const approach = e.kind === 'boss' ? 1 : 1 - DEPTH.approachScale * (1 - progress);
        const h = e.r * (e.kind === 'boss' ? 2.7 : 3.1) * 1.2 * approach;
        if (e.kind === 'boss') {
          place(group, e.x, e.y, h, h);
          group.scale.y = group.scale.z = group.scale.x;
          // Tilt the saucer toward the player so its dome and rim read in 3D.
          group.rotation.set(0.35 + Math.sin(time * 1.4) * 0.05, Math.max(-0.3, Math.min(0.3, e.vx / 300)), 0);
          const spin = group.children[0]; if (spin) spin.rotation.z = time * 0.9;
          continue;
        }
        const top = group.children[1];
        if (top instanceof THREE.Mesh) top.geometry = relief(e.kind);
        place(group, e.x, e.y, h * image.width / image.height, h * 1.08);
        group.rotation.set(0.1 * (1 - progress),
          Math.max(-0.65, Math.min(0.65, e.vx / 150)) * 0.9, Math.atan2(e.vx, Math.max(80, e.vy)) * 0.25);
      }
      for (const [kind, list] of Object.entries(pools)) list.forEach((ship, i) => { ship.visible = i < (counts[kind as Actor['kind']] ?? 0); });
      hero.visible = pilot.visible;
      const heroTop = hero.children[1]; if (heroTop instanceof THREE.Mesh) heroTop.geometry = relief('player');
      place(hero, pilot.x, pilot.y, 82, 85);
      hero.rotation.set(DEPTH.pitch, -pilot.bank * DEPTH.bank, -pilot.bank * 0.45);
      const shift = (pilot.x / width - 0.5) * 45;
      skyCamera.position.x = shift; skyCamera.rotation.y = shift * 0.0006; skyCamera.rotation.x = -0.3;
      const positions = starsGeometry.getAttribute('position');
      for (let i = 0; i < DEPTH.starCount; i++) positions.setZ(i, -250 - ((i * 43 - time * 55) % 1100 + 1100) % 1100);
      positions.needsUpdate = true;
      asteroids.forEach((asteroid, i) => {
        let rock = rocks[i];
        if (!rock) { rock = new THREE.Mesh(rockGeometry, rockMaterial); scene.add(rock); rocks[i] = rock; }
        rock.visible = true;
        place(rock, asteroid.x, asteroid.y, asteroid.r, asteroid.r * Math.cos(DEPTH.cameraTilt));
        // A spherical obstacle keeps its exact original screen radius.
        rock.scale.z = rock.scale.x;
        rock.rotation.set(asteroid.angle * 0.6, asteroid.angle * 0.8, asteroid.angle);
      });
      rocks.forEach((rock, i) => { rock.visible = i < asteroids.length; });
      renderer.clear(); renderer.render(sky, skyCamera); renderer.clearDepth();
      moon.visible = moonPass !== null;
      earth.visible = earthPass !== null && !!imageOf(earthMap)?.naturalWidth;
      if (moonPass) {
        // The sphere mesh has unit radius: pass the collision radius itself, so the
        // drawn disc and the deadly area are the same circle.
        place(moon, moonPass.x, moonPass.y, moonPass.r, moonPass.r);
        moon.scale.y = moon.scale.z = moon.scale.x; moon.rotation.y = moonPass.spin;
      }
      if (earthPass) {
        place(earth, earthPass.x, earthPass.y, earthPass.r, earthPass.r);
        earth.scale.y = earth.scale.z = earth.scale.x; earth.rotation.y = earthPass.spin;
      }
      if (moonPass || earthPass) { renderer.render(moonScene, camera); renderer.clearDepth(); }
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, 0, 0, width, height);
      ctx.canvas.dataset['sceneReady'] = '1';
      if (import.meta.env.DEV) ctx.canvas.dataset['drawCalls'] = String(renderer.info.render.calls);
      return true;
    },
    dispose() {
      disposed = true; ufoParts.forEach(({ g, m }) => { g.dispose(); m.dispose(); }); renderer.dispose(); geometry.dispose(); rockGeometry.dispose(); starsGeometry.dispose();
      Object.values(reliefs).forEach(surface => surface.dispose());
      environment.dispose();
      rockTexture.dispose(); rockMaterial.dispose(); moonMap.dispose(); moonGeometry.dispose(); moonMaterial.dispose(); starsMaterial.dispose(); earthMap.dispose(); earthMaterial.dispose();
      Object.values(textures).forEach(texture => texture.dispose());
      Object.values(materials).forEach(material => { material.top.dispose(); material.side.dispose(); });
    },
  };
}