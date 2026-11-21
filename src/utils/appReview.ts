import { Capacitor } from '@capacitor/core';
import { APP_STORE_ID, ANDROID_PACKAGE } from '@/utils/storeLinks';

/**
 * Avis sur les stores, conforme aux règles Apple (5.6.1) et Google :
 * - demande automatique = fenêtre NATIVE (SKStoreReviewController / Play In-App Review), jamais de question maison ;
 * - aucun filtrage « tu aimes le jeu ? » avant d'envoyer vers le store ;
 * - le bouton « Laisse-nous un avis » (action volontaire du joueur) ouvre directement la page d'avis.
 */
const STATE_KEY = 'ls_native_review';
const MIN_GAMES = 6;
const MIN_DAYS_BETWEEN = 45;
const MIN_SCORE = 25;

type ReviewState = { games: number; lastAsk: number; asks: number };

function readState(): ReviewState {
  try {
    return { games: 0, lastAsk: 0, asks: 0, ...JSON.parse(localStorage.getItem(STATE_KEY) || '{}') };
  } catch {
    return { games: 0, lastAsk: 0, asks: 0 };
  }
}
const saveState = (s: ReviewState) => { try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* ignore */ } };

/** À appeler à chaque fin de partie. Renvoie true si c'est un bon moment pour la demande native. */
export function recordGameForReview(score: number): boolean {
  const s = readState();
  s.games += 1;
  saveState(s);
  if (!Capacitor.isNativePlatform()) return false;
  const daysSince = (Date.now() - s.lastAsk) / 86_400_000;
  return s.games >= MIN_GAMES && score >= MIN_SCORE && daysSince >= MIN_DAYS_BETWEEN && s.asks < 3;
}

/** Affiche la fenêtre d'avis native (le système décide seul s'il l'affiche réellement). */
export async function requestNativeReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const s = readState();
  s.lastAsk = Date.now();
  s.asks += 1;
  saveState(s);
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch (error) {
    console.warn('[appReview] Native review unavailable:', error);
  }
}

/** Bouton volontaire : ouvre directement la page d'avis du store. */
export function openStoreReviewPage(): void {
  const url = Capacitor.getPlatform() === 'android'
    ? `market://details?id=${ANDROID_PACKAGE}`
    : `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
  window.open(url, '_blank');
}
