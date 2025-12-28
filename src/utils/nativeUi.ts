import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

let guardsInstalled = false;
let restoreInFlight = false;

export async function restoreNativeUi(reason?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (restoreInFlight) return;

  restoreInFlight = true;
  const label = reason ? ` (${reason})` : '';

  const run = async (step: string) => {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.show();
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
      console.log(`[NativeUI] restored${label} - ${step}`);
    } catch (err) {
      console.log(`[NativeUI] restore failed${label} - ${step}:`, err);
    }
  };

  // Plusieurs tentatives: certaines pubs ré-appliquent l'overlay après la fermeture
  await run('t+0');
  setTimeout(() => void run('t+200ms'), 200);
  setTimeout(() => void run('t+700ms'), 700);
  setTimeout(() => {
    void run('t+1500ms');
    restoreInFlight = false;
  }, 1500);
}

export function installNativeUiGuards(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (guardsInstalled) return;
  guardsInstalled = true;

  const guard = () => void restoreNativeUi('guard');

  window.addEventListener('focus', guard);
  window.addEventListener('pageshow', guard);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) guard();
  });
}
