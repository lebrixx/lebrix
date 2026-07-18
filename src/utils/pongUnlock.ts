import { ModeID, ModeType } from '@/constants/modes';

export const PONG_UNLOCK_TARGET = 20;

export const PONG_UNLOCK_MODES: ModeType[] = [
  ModeID.CLASSIC,
  ModeID.ARC_CHANGEANT,
  ModeID.SURVIE_60S,
  ModeID.ZONE_MOBILE,
  ModeID.ZONE_TRAITRESSE,
  ModeID.MEMOIRE_EXPERT,
];

export interface PongUnlockProgressItem {
  mode: ModeType;
  score: number;
  completed: boolean;
}

export function getPongUnlockProgress(): PongUnlockProgressItem[] {
  const saved = localStorage.getItem('luckyStopGame');
  let data: Record<string, number> = {};
  try {
    data = saved ? JSON.parse(saved) : {};
  } catch {
    data = {};
  }
  return PONG_UNLOCK_MODES.map((m) => {
    const score = (data[`bestScore_${m}`] as number) || 0;
    return { mode: m, score, completed: score >= PONG_UNLOCK_TARGET };
  });
}

export const BRIX_FACTORY_UNLOCK_KEY = 'ls_brix_factory_unlocked';

export function isBrixFactoryOverrideUnlocked(): boolean {
  try {
    return localStorage.getItem(BRIX_FACTORY_UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setBrixFactoryOverrideUnlocked(): void {
  try {
    localStorage.setItem(BRIX_FACTORY_UNLOCK_KEY, 'true');
  } catch {}
}

export function isPongUnlocked(): boolean {
  if (isBrixFactoryOverrideUnlocked()) return true;
  return getPongUnlockProgress().every((p) => p.completed);
}

export const isBrixFactoryUnlocked = isPongUnlocked;

export function getPongUnlockCount(): { done: number; total: number } {
  const items = getPongUnlockProgress();
  return { done: items.filter((i) => i.completed).length, total: items.length };
}
