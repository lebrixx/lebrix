import { ANIMALS } from './animals';
import fenceUrl from '@/assets/brix-rush/terrain/fence.png';
import titleUrl from '@/assets/brix-rush-logo.png';

const images = new Map<string, { image: HTMLImageElement; ready: Promise<void> }>();

/** Keep decoded artwork for replay; never construct browser objects at import time. */
function entry(url: string) {
  const cached = images.get(url);
  if (cached) return cached;
  const image = new Image();
  const ready = new Promise<void>((resolve) => {
    image.onload = () => {
      image.decode().catch(() => undefined).then(() => resolve());
    };
    // Preserve the painters' original fallback behavior if an asset cannot load.
    image.onerror = () => resolve();
  });
  const value = { image, ready };
  images.set(url, value);
  image.src = url;
  return value;
}

export function brixImage(url: string) {
  return entry(url).image;
}

export function imageReady(url: string) {
  return entry(url).ready;
}

export function prepareBrixImages() {
  return Promise.all([fenceUrl, titleUrl, ...ANIMALS.map(animal => animal.url)].map(imageReady));
}