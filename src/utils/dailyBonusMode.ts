// Système de bonus x2 quotidien via machine à sous
import { ModeType, ModeID } from '@/constants/modes';

const STORAGE_KEY = 'dailyBonusMode';

interface DailyBonusData {
  bonusMode: ModeType | null;  // Le mode avec x2
  activatedAt: number;         // Timestamp d'activation
  expiresAt: number;           // Timestamp d'expiration (minuit + 1 min)
  hasSpunToday: boolean;       // A déjà lancé la machine aujourd'hui
  dayKey: string;              // Clé du jour (YYYY-MM-DD)
}

/** Retourne la clé du jour courant */
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Calcule le timestamp de 00:01 du jour suivant */
function getNextResetTimestamp(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0, 0);
  return tomorrow.getTime();
}

/** Charge les données du bonus quotidien */
function loadData(): DailyBonusData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: DailyBonusData = JSON.parse(raw);
      // Reset si le jour a changé
      if (data.dayKey !== getTodayKey()) {
        return { bonusMode: null, activatedAt: 0, expiresAt: 0, hasSpunToday: false, dayKey: getTodayKey() };
      }
      // Reset si expiré
      if (data.expiresAt > 0 && Date.now() >= data.expiresAt) {
        return { bonusMode: null, activatedAt: 0, expiresAt: 0, hasSpunToday: false, dayKey: getTodayKey() };
      }
      return data;
    }
  } catch (e) {
    console.error('[DailyBonus] Error loading data:', e);
  }
  return { bonusMode: null, activatedAt: 0, expiresAt: 0, hasSpunToday: false, dayKey: getTodayKey() };
}

/** Sauvegarde les données */
function saveData(data: DailyBonusData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Vérifie si le joueur peut lancer la machine aujourd'hui */
export function canSpinSlotToday(): boolean {
  const data = loadData();
  return !data.hasSpunToday;
}

/** Retourne le mode bonus actif (ou null) */
export function getActiveBonusMode(): ModeType | null {
  const data = loadData();
  if (data.bonusMode && data.expiresAt > Date.now()) {
    return data.bonusMode;
  }
  return null;
}

/** Vérifie si un mode spécifique a le bonus x2 actif */
export function isBonusActive(mode: ModeType): boolean {
  return getActiveBonusMode() === mode;
}

/** Retourne le multiplicateur de coins pour un mode donné */
export function getCoinMultiplier(mode: ModeType): number {
  return isBonusActive(mode) ? 2 : 1;
}

/** Liste des modes éligibles au tirage (tous sauf expert) */
export function getEligibleModes(unlockedModes: string[]): ModeType[] {
  const allModes: ModeType[] = [
    ModeID.CLASSIC,
    ModeID.ARC_CHANGEANT,
    ModeID.SURVIE_60S,
    ModeID.ZONE_MOBILE,
    ModeID.ZONE_TRAITRESSE,
    ModeID.MEMOIRE_EXPERT,
  ];
  return allModes.filter(m => unlockedModes.includes(m));
}

/** Effectue le tirage et active le bonus sur le mode sélectionné */
export function activateDailyBonus(selectedMode: ModeType): void {
  const data = loadData();
  data.bonusMode = selectedMode;
  data.activatedAt = Date.now();
  data.expiresAt = getNextResetTimestamp();
  data.hasSpunToday = true;
  data.dayKey = getTodayKey();
  saveData(data);
}

/** Retourne le temps restant avant l'expiration en ms */
export function getBonusTimeRemaining(): number {
  const data = loadData();
  if (!data.bonusMode || data.expiresAt <= 0) return 0;
  return Math.max(0, data.expiresAt - Date.now());
}
