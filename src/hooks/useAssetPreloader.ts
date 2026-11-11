import { useEffect, useState } from "react";

/**
 * Précharge une liste d'assets (images, sons, vidéos, polices…) et renvoie
 * la progression (0 → 100) + un booléen `done`.
 *
 * - Un asset qui échoue ne bloque pas le chargement (il compte comme chargé).
 * - `minDurationMs` garantit que l'animation du logo a le temps de se jouer.
 * - `timeoutMs` : sécurité, le jeu se lance quoi qu'il arrive après ce délai.
 */
export function useAssetPreloader(
  urls: string[],
  { minDurationMs = 2500, timeoutMs = 15000 } = {}
) {
  const [loaded, setLoaded] = useState(0);
  const [done, setDone] = useState(false);
  const total = urls.length;

  useEffect(() => {
    let cancelled = false;
    let count = 0;
    const start = performance.now();

    const tick = () => {
      if (cancelled) return;
      count += 1;
      setLoaded(count);
    };

    const loadOne = (url: string) =>
      loadAsset(url)
        .catch(() => console.warn("[preload] échec :", url))
        .finally(tick);

    const all = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      ...urls.map(loadOne),
    ]);
    const timeout = new Promise((r) => setTimeout(r, timeoutMs));

    Promise.race([all, timeout]).then(async () => {
      const elapsed = performance.now() - start;
      if (elapsed < minDurationMs) {
        await new Promise((r) => setTimeout(r, minDurationMs - elapsed));
      }
      if (!cancelled) setDone(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join("|")]);

  const progress = total === 0 ? 100 : Math.round((loaded / total) * 100);
  return { progress: done ? 100 : progress, done };
}

const IMAGE = /\.(png|jpe?g|webp|avif|gif|svg)(\?.*)?$/i;
const AUDIO = /\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i;
const VIDEO = /\.(mp4|webm)(\?.*)?$/i;

export function loadAsset(url: string): Promise<unknown> {
  if (IMAGE.test(url)) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => (img.decode ? img.decode().then(resolve, resolve) : resolve(img));
      img.onerror = reject;
      img.src = url;
    });
  }
  if (AUDIO.test(url) || VIDEO.test(url)) {
    // fetch complet : le fichier est mis en cache par le navigateur
    return fetch(url).then((r) => r.blob());
  }
  // tout le reste (json, polices, sprites…) : simple fetch mis en cache
  return fetch(url).then((r) => r.arrayBuffer());
}
