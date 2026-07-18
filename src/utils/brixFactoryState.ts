// Brix Factory — état, sauvegarde locale, formules

const STORAGE_KEY = 'brix_factory_state_v1';

export interface BrixFactoryState {
  brix: number;
  stored: number;
  totalProduced: number;
  reactorLevel: number;
  storageLevel: number;
  amplifierLevel: number;
  lastTick: number;
  lastDailyClaim: number;
  dailyStreak: number;
}

const defaultState = (): BrixFactoryState => ({
  brix: 0,
  stored: 0,
  totalProduced: 0,
  reactorLevel: 1,
  storageLevel: 1,
  amplifierLevel: 1,
  lastTick: Date.now(),
  lastDailyClaim: 0,
  dailyStreak: 0,
});

export function loadState(): BrixFactoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(s: BrixFactoryState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

// ---- Formules ----
// ---- Formules (progression douce, pas de doublement) ----
export const reactorRate = (lvl: number) => 0.002 * lvl; // Brix/sec — linéaire, très progressif
export const amplifierMult = (lvl: number) => 1 + 0.05 * (lvl - 1); // +5% par niveau
export const productionPerSec = (s: BrixFactoryState) =>
  reactorRate(s.reactorLevel) * amplifierMult(s.amplifierLevel);
export const productionPerMin = (s: BrixFactoryState) =>
  productionPerSec(s) * 60;

// Stockage linéaire au lieu de doublement
export const storageCapacity = (lvl: number) => 5 + 4 * lvl;

// Coûts en croissance douce (~35–60% par niveau) au lieu de quadratique
export const reactorCost = (lvl: number) => Math.max(1, Math.ceil(1 * Math.pow(1.35, lvl - 1)));
export const storageCost = (lvl: number) => Math.max(2, Math.ceil(2 * Math.pow(1.5, lvl - 1)));
export const amplifierCost = (lvl: number) => Math.max(10, Math.ceil(10 * Math.pow(1.6, lvl - 1)));

// ---- Production hors-ligne ----
export function applyOfflineProduction(s: BrixFactoryState): { state: BrixFactoryState; gained: number } {
  const now = Date.now();
  const dtSec = Math.max(0, (now - s.lastTick) / 1000);
  const cap = storageCapacity(s.storageLevel);
  const room = Math.max(0, cap - s.stored);
  const rawGain = productionPerSec(s) * dtSec;
  const gain = Math.min(room, rawGain);
  return {
    state: {
      ...s,
      stored: s.stored + gain,
      lastTick: now,
    },
    gained: gain,
  };
}

// ---- Bonus quotidien ----
const DAILY_TIERS = [25, 50, 100, 150, 250, 400, 750];
const DAY_MS = 24 * 3600 * 1000;

export function dailyBonusStatus(s: BrixFactoryState) {
  const now = Date.now();
  const since = now - s.lastDailyClaim;
  const available = s.lastDailyClaim === 0 || since >= DAY_MS;
  const nextIn = available ? 0 : DAY_MS - since;
  // Prochaine récompense en fonction du streak (ne consomme pas encore le streak)
  const nextStreak =
    s.lastDailyClaim === 0
      ? 1
      : since > 2 * DAY_MS
        ? 1
        : s.dailyStreak + (available ? 1 : 0);
  const idx = Math.min(DAILY_TIERS.length - 1, Math.max(0, nextStreak - 1));
  return { available, nextIn, amount: DAILY_TIERS[idx], streak: nextStreak };
}

export function claimDailyBonus(s: BrixFactoryState): BrixFactoryState {
  const status = dailyBonusStatus(s);
  if (!status.available) return s;
  return {
    ...s,
    brix: s.brix + status.amount,
    totalProduced: s.totalProduced + status.amount,
    lastDailyClaim: Date.now(),
    dailyStreak: status.streak,
  };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatBrix(n: number): string {
  const v = Math.floor(n);
  if (v < 10_000) return v.toLocaleString('fr-FR');
  if (v < 1_000_000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  if (v < 1_000_000_000) return (v / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  return (v / 1_000_000_000).toFixed(2).replace(/\.00$/, '') + 'B';
}
