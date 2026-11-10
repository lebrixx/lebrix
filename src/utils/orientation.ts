import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

/** Brix Factory is the only mode allowed to rotate; everything else stays portrait. */
export function unlockOrientation() {
  try {
    if (Capacitor.isNativePlatform()) ScreenOrientation.unlock().catch(() => {});
    else (screen as any).orientation?.unlock?.();
  } catch {}
}

export function lockPortraitOrientation() {
  try {
    if (Capacitor.isNativePlatform()) ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    else (screen as any).orientation?.lock?.('portrait')?.catch?.(() => {});
  } catch {}
}
