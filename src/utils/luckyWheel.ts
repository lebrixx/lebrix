// Système de gestion de la roue de la chance

import { BoostType } from '@/types/boosts';

const WHEEL_KEY = 'lucky_wheel_state';

export interface WheelState {
  lastFreeSpinDate: string | null;
  totalSpins: number;
}

export type WheelRewardType = 
  | { type: 'coins'; amount: number }
  | { type: 'boost'; boostId: BoostType }
  | { type: 'tickets'; amount: number }
  | { type: 'diamonds'; amount: number };

export interface WheelSegment {
  id: string;
  label: string;
  reward: WheelRewardType;
  color: string;
  probability: number; // Poids relatif
}

// Segments de la roue avec probabilités
export const WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 'coins_10', label: '10', reward: { type: 'coins', amount: 10 }, color: 'hsl(var(--secondary))', probability: 25 },
  { id: 'boost_shield', label: '🛡️', reward: { type: 'boost', boostId: 'shield' }, color: 'hsl(var(--primary))', probability: 12 },
  { id: 'coins_30', label: '30', reward: { type: 'coins', amount: 30 }, color: 'hsl(var(--secondary))', probability: 18 },
  { id: 'tickets_1', label: '🎟️', reward: { type: 'tickets', amount: 1 }, color: 'hsl(var(--accent))', probability: 15 },
  { id: 'boost_bigger', label: '🎯', reward: { type: 'boost', boostId: 'bigger_zone' }, color: 'hsl(var(--primary))', probability: 12 },
  { id: 'coins_100', label: '100', reward: { type: 'coins', amount: 100 }, color: 'hsl(var(--secondary))', probability: 5 },
  { id: 'tickets_3', label: '🎟️x3', reward: { type: 'tickets', amount: 3 }, color: 'hsl(var(--accent))', probability: 8 },
  { id: 'boost_start', label: '🚀', reward: { type: 'boost', boostId: 'start_20' }, color: 'hsl(var(--primary))', probability: 10 },
  { id: 'diamond_1', label: '💎', reward: { type: 'diamonds', amount: 1 }, color: 'hsl(var(--accent))', probability: 5 },
];

/**
 * Récupérer l'état de la roue
 */
export function getWheelState(): WheelState {
  try {
    const saved = localStorage.getItem(WHEEL_KEY);
    if (!saved) {
      return { lastFreeSpinDate: null, totalSpins: 0 };
    }
    return JSON.parse(saved);
  } catch {
    return { lastFreeSpinDate: null, totalSpins: 0 };
  }
}

/**
 * Sauvegarder l'état de la roue
 */
export function saveWheelState(state: WheelState): void {
  localStorage.setItem(WHEEL_KEY, JSON.stringify(state));
}

/**
 * Vérifier si le tour gratuit est disponible
 */
export function canSpinFree(): boolean {
  const state = getWheelState();
  if (!state.lastFreeSpinDate) return true;
  
  const today = new Date().toDateString();
  return state.lastFreeSpinDate !== today;
}

/**
 * Récupérer la date du dernier tour gratuit
 */
export function getLastFreeSpinDate(): string | null {
  return getWheelState().lastFreeSpinDate;
}

/**
 * Calculer le temps restant jusqu'au prochain tour gratuit (en millisecondes)
 */
export function getTimeUntilNextFreeSpin(): number {
  if (canSpinFree()) return 0;
  
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Formater le temps restant en heures:minutes:secondes
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Marquer le tour gratuit comme utilisé
 */
export function markFreeSpinUsed(): void {
  const state = getWheelState();
  state.lastFreeSpinDate = new Date().toDateString();
  state.totalSpins++;
  saveWheelState(state);
}

/**
 * Sélectionner un segment aléatoire basé sur les probabilités
 */
export function spinWheel(): { segmentIndex: number; segment: WheelSegment } {
  const totalWeight = WHEEL_SEGMENTS.reduce((sum, s) => sum + s.probability, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    random -= WHEEL_SEGMENTS[i].probability;
    if (random <= 0) {
      return { segmentIndex: i, segment: WHEEL_SEGMENTS[i] };
    }
  }
  
  // Fallback au dernier segment
  return { segmentIndex: WHEEL_SEGMENTS.length - 1, segment: WHEEL_SEGMENTS[WHEEL_SEGMENTS.length - 1] };
}

/**
 * Calculer l'angle de rotation pour un segment donné
 * Le pointeur est en haut (position 12h), et la roue commence à -90° (3h)
 * Pour que le segment X soit sous le pointeur, on doit tourner la roue de sorte que
 * le milieu du segment X soit à la position du pointeur (en haut)
 */
export function calculateRotationAngle(segmentIndex: number): number {
  const segmentAngle = 360 / WHEEL_SEGMENTS.length;
  const baseRotation = 360 * 5; // 5 tours complets minimum pour l'effet
  
  // L'angle du milieu du segment par rapport au début de la roue
  const segmentMiddleAngle = segmentIndex * segmentAngle + segmentAngle / 2;
  
  // On doit tourner dans le sens inverse pour amener ce segment sous le pointeur
  // Le pointeur est en haut, les segments commencent à -90° (donc segment 0 est déjà en haut)
  const rotationNeeded = 360 - segmentMiddleAngle;
  
  return baseRotation + rotationNeeded;
}

/**
 * Vérifier et envoyer une notification si la roue est prête
 */
export function checkWheelNotification(): void {
  if (canSpinFree()) {
    // Déclencher la notification via un événement custom
    window.dispatchEvent(new CustomEvent('wheelReady'));
  }
}
