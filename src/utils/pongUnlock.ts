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

export function isPongUnlocked(): boolean {
  return getPongUnlockProgress().every((p) => p.completed);
}

export function getPongUnlockCount(): { done: number; total: number } {
  const items = getPongUnlockProgress();
  return { done: items.filter((i) => i.completed).length, total: items.length };
}
