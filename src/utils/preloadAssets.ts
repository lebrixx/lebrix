import { loadAsset } from '@/hooks/useAssetPreloader';

/** Stage 1 (launch loader): everything the menus/screens show. Game-mode art is deferred. */
const allAppAssets = import.meta.glob(
  '/src/assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg,mp3,ogg,wav,m4a}',
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const MODE_DIRS = ['/src/assets/brix-rush/', '/src/assets/brix-arena/'];
const UNUSED = ['/src/assets/mobile-issue-'];

export const LAUNCH_ASSETS: string[] = Object.entries(allAppAssets)
  .filter(([p]) => !MODE_DIRS.some((d) => p.startsWith(d)) && !UNUSED.some((u) => p.startsWith(u)))
  .map(([, u]) => u);

/** Stage 2 (main menu, background): game-mode sprites, hosted games and 3D models. */
const modeAssets = import.meta.glob(
  ['/src/assets/brix-rush/**/*.{png,jpg,jpeg,webp,svg}', '/src/assets/brix-arena/**/*.{png,jpg,jpeg,webp,svg}', '/src/games/**/*.{png,jpg,jpeg,webp,svg,mp3,ogg,wav,glb}'],
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>;

const PUBLIC_MODE_FILES = ["games/bloup/fonts/outfit-400.ttf", "games/bloup/fonts/outfit-500.ttf", "games/bloup/fonts/outfit-600.ttf", "games/bloup/fonts/outfit-700.ttf", "games/bloup/fonts/outfit-800.ttf", "games/bloup/index.html", "games/brix-factory/index.html", "games/chronophase/icone.svg", "games/chronophase/index.html", "games/chronophase/manifest.webmanifest", "games/chronophase/vendor/jsm/environments/RoomEnvironment.js", "games/chronophase/vendor/jsm/geometries/RoundedBoxGeometry.js", "games/chronophase/vendor/jsm/postprocessing/EffectComposer.js", "games/chronophase/vendor/jsm/postprocessing/MaskPass.js", "games/chronophase/vendor/jsm/postprocessing/OutputPass.js", "games/chronophase/vendor/jsm/postprocessing/Pass.js", "games/chronophase/vendor/jsm/postprocessing/RenderPass.js", "games/chronophase/vendor/jsm/postprocessing/ShaderPass.js", "games/chronophase/vendor/jsm/postprocessing/UnrealBloomPass.js", "games/chronophase/vendor/jsm/shaders/CopyShader.js", "games/chronophase/vendor/jsm/shaders/FXAAShader.js", "games/chronophase/vendor/jsm/shaders/LuminosityHighPassShader.js", "games/chronophase/vendor/jsm/shaders/OutputShader.js", "games/chronophase/vendor/three.module.js", "models/f104.glb", "models/patch-dirt.glb", "models/patch-grass.glb", "models/rocks-high.glb", "models/square-lq-plate-4x4.glb", "models/tree.glb"];

let modesStarted = false;
/** Preload game modes once, in small idle batches so the menu stays smooth. */
export function preloadGameModes() {
  if (modesStarted) return;
  modesStarted = true;
  const base = import.meta.env.BASE_URL;
  const queue = [
    ...Object.values(modeAssets),
    ...PUBLIC_MODE_FILES.map((p) => base + p),
  ];
  // Warm lazily loaded code chunks too.
  import('@/games/brix-arena/ArenaLobby3D').catch(() => {});
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200);
  const next = () => {
    const batch = queue.splice(0, 4);
    if (!batch.length) return;
    Promise.allSettled(batch.map((u) => loadAsset(u))).then(() => idle(next));
  };
  idle(next);
}
