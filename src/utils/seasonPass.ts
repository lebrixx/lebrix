// Season Pass System - Diamonds, Tiers, Daily Challenges, Decorations

export type UsernameColor = 'violet' | 'pulse' | null;

export interface Decoration {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  tier: number;
  preview: string;
  isColorReward?: boolean; // true = couleur de pseudo plutôt qu'emoji
  color?: UsernameColor;
}

export interface PassTier {
  tier: number;
  diamondsCost: number;
  decoration: Decoration;
}

export interface DailyQuestState {
  date: string; // YYYY-MM-DD
  // Quest 1: Score 25+ in any mode
  quest1Completed: boolean;
  // Quest 2: Use a boost in any mode
  quest2Completed: boolean;
  // Reward claimed (both quests needed)
  claimed: boolean;
}

export interface SeasonPassData {
  diamonds: number;
  currentTier: number;
  equippedDecoration: string | null;
  equippedUsernameColor: UsernameColor;
  totalDiamondsEarned: number;
  dailyQuests: DailyQuestState | null;
}

const STORAGE_KEY = 'ls_season_pass';

export const DECORATIONS: Decoration[] = [
  { id: 'star', name: 'Étoile', prefix: '⭐ ', suffix: '', tier: 1, preview: '⭐ Pseudo' },
  { id: 'fire', name: 'Flamme', prefix: '🔥 ', suffix: ' 🔥', tier: 2, preview: '🔥 Pseudo 🔥' },
  { id: 'sparkle', name: 'Étincelle', prefix: '✨ ', suffix: ' ✨', tier: 3, preview: '✨ Pseudo ✨' },
  { id: 'purple_name', name: 'Pseudo Violet', prefix: '', suffix: '', tier: 4, preview: '💜 Pseudo en violet', isColorReward: true, color: 'violet' },
  { id: 'crown', name: 'Couronne', prefix: '👑 ', suffix: '', tier: 5, preview: '👑 Pseudo' },
  { id: 'diamond', name: 'Diamant', prefix: '💎 ', suffix: ' 💎', tier: 6, preview: '💎 Pseudo 💎' },
  { id: 'trophy', name: 'Trophée', prefix: '🏆 ', suffix: ' 🏆', tier: 7, preview: '🏆 Pseudo 🏆' },
  { id: 'dragon', name: 'Dragon', prefix: '🐉 ', suffix: ' 🐉', tier: 8, preview: '🐉 Pseudo 🐉' },
  { id: 'pulse_name', name: 'Pseudo Pulsé', prefix: '', suffix: '', tier: 9, preview: '💫 Pseudo pulsé', isColorReward: true, color: 'pulse' },
];

export const PASS_TIERS: PassTier[] = DECORATIONS.map((deco, i) => ({
  tier: i + 1,
  diamondsCost: [2, 5, 9, 14, 20, 27, 35, 44, 55][i],
  decoration: deco,
}));

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSeasonPassData(): SeasonPassData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migration: ancien format dailyChallenge → nouveau dailyQuests
      if (parsed.dailyChallenge !== undefined && parsed.dailyQuests === undefined) {
        parsed.dailyQuests = null;
        delete parsed.dailyChallenge;
      }
      return parsed;
    }
  } catch {}
  return {
    diamonds: 0,
    currentTier: 0,
    equippedDecoration: null,
    equippedUsernameColor: null as UsernameColor,
    totalDiamondsEarned: 0,
    dailyQuests: null,
  };
}

function savePassData(data: SeasonPassData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function addDiamonds(count: number): SeasonPassData {
  const data = getSeasonPassData();
  data.diamonds += count;
  data.totalDiamondsEarned += count;
  savePassData(data);
  return data;
}

export function getDiamonds(): number {
  return getSeasonPassData().diamonds;
}

export function unlockTier(tier: number): boolean {
  const data = getSeasonPassData();
  const passTier = PASS_TIERS.find(t => t.tier === tier);
  if (!passTier) return false;
  if (data.currentTier >= tier) return false;
  if (tier !== data.currentTier + 1) return false;
  const prevCost = tier > 1 ? PASS_TIERS[tier - 2].diamondsCost : 0;
  const tierCost = passTier.diamondsCost - prevCost;
  if (data.diamonds < tierCost) return false;
  data.diamonds -= tierCost;
  data.currentTier = tier;
  savePassData(data);
  return true;
}

export function getTierCost(tier: number): number {
  const prevCost = tier > 1 ? PASS_TIERS[tier - 2].diamondsCost : 0;
  return PASS_TIERS[tier - 1].diamondsCost - prevCost;
}

export function equipDecoration(decorationId: string | null): void {
  const data = getSeasonPassData();
  const deco = decorationId ? DECORATIONS.find(d => d.id === decorationId) : null;
  if (deco?.isColorReward) {
    data.equippedUsernameColor = deco.color || null;
    data.equippedDecoration = decorationId;
  } else {
    data.equippedDecoration = decorationId;
  }
  savePassData(data);
}

export function equipUsernameColor(color: UsernameColor): void {
  const data = getSeasonPassData();
  data.equippedUsernameColor = color;
  if (color === 'violet') {
    data.equippedDecoration = 'purple_name';
  } else if (color === 'pulse') {
    data.equippedDecoration = 'pulse_name';
  } else if (data.equippedDecoration === 'purple_name' || data.equippedDecoration === 'pulse_name') {
    data.equippedDecoration = null;
  }
  savePassData(data);
}

export function getEquippedUsernameColor(): UsernameColor {
  const data = getSeasonPassData();
  return data.equippedUsernameColor ?? null;
}

export function getEquippedDecoration(): Decoration | null {
  const data = getSeasonPassData();
  if (!data.equippedDecoration) return null;
  return DECORATIONS.find(d => d.id === data.equippedDecoration) || null;
}

export function getEquippedDecorationId(): string | null {
  return getSeasonPassData().equippedDecoration;
}

export function applyDecoration(username: string, decorationsString: string | null): string {
  if (!decorationsString) return username;
  // Supporte le format combiné "star,purple_name" — cherche le premier emoji deco (non-couleur)
  const ids = decorationsString.split(',').map(d => d.trim());
  const decoId = ids.find(id => {
    const d = DECORATIONS.find(dec => dec.id === id);
    return d && !d.isColorReward;
  });
  if (!decoId) return username;
  const deco = DECORATIONS.find(d => d.id === decoId);
  if (!deco) return username;
  return `${deco.prefix}${username}${deco.suffix}`;
}

// ── Daily Quests ──

function ensureTodayQuests(data: SeasonPassData): SeasonPassData {
  const today = getTodayStr();
  if (!data.dailyQuests || data.dailyQuests.date !== today) {
    data.dailyQuests = {
      date: today,
      quest1Completed: false,
      quest2Completed: false,
      claimed: false,
    };
    savePassData(data);
  }
  return data;
}

export function getDailyQuests(): DailyQuestState {
  const data = ensureTodayQuests(getSeasonPassData());
  return data.dailyQuests!;
}

/** Appelé en fin de partie — met à jour la quête score 25+ */
export function updateQuestScore(score: number): void {
  const data = getSeasonPassData();
  ensureTodayQuests(data);
  if (data.dailyQuests!.quest1Completed) return;
  if (score >= 25) {
    data.dailyQuests!.quest1Completed = true;
    savePassData(data);
  }
}

/** Appelé quand un boost est utilisé en jeu */
export function updateQuestBoostUsed(): void {
  const data = getSeasonPassData();
  ensureTodayQuests(data);
  if (data.dailyQuests!.quest2Completed) return;
  data.dailyQuests!.quest2Completed = true;
  savePassData(data);
}

/** Retourne true si les 2 quêtes sont complètes mais pas encore récupérées */
export function hasDailyQuestReward(): boolean {
  const data = getSeasonPassData();
  const today = getTodayStr();
  if (!data.dailyQuests || data.dailyQuests.date !== today) return false;
  return data.dailyQuests.quest1Completed && data.dailyQuests.quest2Completed && !data.dailyQuests.claimed;
}

/** Réclame le diamant si les 2 quêtes sont complètes. Retourne true si succès. */
export function claimDailyQuestReward(): boolean {
  const data = getSeasonPassData();
  const today = getTodayStr();
  if (!data.dailyQuests || data.dailyQuests.date !== today) return false;
  if (!data.dailyQuests.quest1Completed || !data.dailyQuests.quest2Completed) return false;
  if (data.dailyQuests.claimed) return false;
  data.dailyQuests.claimed = true;
  data.diamonds += 1;
  data.totalDiamondsEarned += 1;
  savePassData(data);
  return true;
}
