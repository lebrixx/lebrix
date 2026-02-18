// Season Pass System - Diamonds, Tiers, Daily Challenge, Decorations

export interface Decoration {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  tier: number;
  preview: string; // How it looks applied to a username
}

export interface PassTier {
  tier: number;
  diamondsCost: number; // cumulative diamonds needed
  decoration: Decoration;
}

export interface PassDailyChallenge {
  id: string;
  description: string;
  target: number;
  type: 'score' | 'games';
  mode?: string; // if undefined, any mode counts
}

export interface SeasonPassData {
  diamonds: number;
  currentTier: number; // highest unlocked tier (0 = none)
  equippedDecoration: string | null; // decoration id
  totalDiamondsEarned: number;
  dailyChallenge: {
    date: string; // YYYY-MM-DD
    challengeId: string;
    progress: number;
    completed: boolean;
    claimed: boolean;
  } | null;
}

const STORAGE_KEY = 'ls_season_pass';

// All decorations available in the pass
export const DECORATIONS: Decoration[] = [
  { id: 'star', name: 'Étoile', prefix: '⭐ ', suffix: '', tier: 1, preview: '⭐ Pseudo' },
  { id: 'fire', name: 'Flamme', prefix: '🔥 ', suffix: ' 🔥', tier: 2, preview: '🔥 Pseudo 🔥' },
  { id: 'sparkle', name: 'Étincelle', prefix: '✨ ', suffix: ' ✨', tier: 3, preview: '✨ Pseudo ✨' },
  { id: 'comet', name: 'Comète', prefix: '☄️ ', suffix: '', tier: 4, preview: '☄️ Pseudo' },
  { id: 'crown', name: 'Couronne', prefix: '👑 ', suffix: '', tier: 5, preview: '👑 Pseudo' },
  { id: 'lightning', name: 'Éclair', prefix: '⚡ ', suffix: ' ⚡', tier: 6, preview: '⚡ Pseudo ⚡' },
  { id: 'diamond', name: 'Diamant', prefix: '💎 ', suffix: ' 💎', tier: 7, preview: '💎 Pseudo 💎' },
  { id: 'trophy', name: 'Trophée', prefix: '🏆 ', suffix: ' 🏆', tier: 8, preview: '🏆 Pseudo 🏆' },
  { id: 'dragon', name: 'Dragon', prefix: '🐉 ', suffix: ' 🐉', tier: 9, preview: '🐉 Pseudo 🐉' },
  { id: 'galaxy', name: 'Galaxie', prefix: '🌌 ', suffix: ' ⭐', tier: 10, preview: '🌌 Pseudo ⭐' },
];

// Pass tiers with cumulative diamond costs
export const PASS_TIERS: PassTier[] = DECORATIONS.map((deco, i) => ({
  tier: i + 1,
  diamondsCost: [2, 5, 9, 14, 20, 27, 35, 44, 55, 70][i],
  decoration: deco,
}));

// Daily challenges pool
const DAILY_CHALLENGES: PassDailyChallenge[] = [
  { id: 'score_15', description: 'Score de 15+ dans une partie', target: 15, type: 'score' },
  { id: 'score_20', description: 'Score de 20+ dans une partie', target: 20, type: 'score' },
  { id: 'score_25', description: 'Score de 25+ dans une partie', target: 25, type: 'score' },
  { id: 'play_3', description: 'Jouer 3 parties', target: 3, type: 'games' },
  { id: 'play_5', description: 'Jouer 5 parties', target: 5, type: 'games' },
  { id: 'score_classic_20', description: 'Score 20+ en Classique', target: 20, type: 'score', mode: 'classic' },
  { id: 'score_survie_15', description: 'Score 15+ en Survie', target: 15, type: 'score', mode: 'survie_60s' },
];

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getSeasonPassData(): SeasonPassData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    diamonds: 0,
    currentTier: 0,
    equippedDecoration: null,
    totalDiamondsEarned: 0,
    dailyChallenge: null,
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
  
  // Already unlocked
  if (data.currentTier >= tier) return false;
  
  // Must unlock in order
  if (tier !== data.currentTier + 1) return false;
  
  // Calculate cost for this specific tier (not cumulative)
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
  data.equippedDecoration = decorationId;
  savePassData(data);
}

export function getEquippedDecoration(): Decoration | null {
  const data = getSeasonPassData();
  if (!data.equippedDecoration) return null;
  return DECORATIONS.find(d => d.id === data.equippedDecoration) || null;
}

export function getEquippedDecorationId(): string | null {
  return getSeasonPassData().equippedDecoration;
}

// Apply decoration to a username for display
export function applyDecoration(username: string, decorationId: string | null): string {
  if (!decorationId) return username;
  const deco = DECORATIONS.find(d => d.id === decorationId);
  if (!deco) return username;
  return `${deco.prefix}${username}${deco.suffix}`;
}

// Daily challenge system
export function getDailyChallenge(): PassDailyChallenge & { progress: number; completed: boolean; claimed: boolean } {
  const data = getSeasonPassData();
  const today = getTodayStr();
  
  // Check if we need a new challenge
  if (!data.dailyChallenge || data.dailyChallenge.date !== today) {
    // Pick a deterministic challenge based on date
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const challenge = DAILY_CHALLENGES[seed % DAILY_CHALLENGES.length];
    
    data.dailyChallenge = {
      date: today,
      challengeId: challenge.id,
      progress: 0,
      completed: false,
      claimed: false,
    };
    savePassData(data);
  }
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === data.dailyChallenge!.challengeId) || DAILY_CHALLENGES[0];
  
  return {
    ...challenge,
    progress: data.dailyChallenge.progress,
    completed: data.dailyChallenge.completed,
    claimed: data.dailyChallenge.claimed,
  };
}

export function updateDailyChallengeProgress(mode: string, score: number): void {
  const data = getSeasonPassData();
  const today = getTodayStr();
  
  if (!data.dailyChallenge || data.dailyChallenge.date !== today || data.dailyChallenge.completed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === data.dailyChallenge!.challengeId);
  if (!challenge) return;
  
  // Check mode filter
  if (challenge.mode && challenge.mode !== mode) return;
  
  if (challenge.type === 'score') {
    if (score >= challenge.target) {
      data.dailyChallenge.progress = challenge.target;
      data.dailyChallenge.completed = true;
    }
  } else if (challenge.type === 'games') {
    data.dailyChallenge.progress += 1;
    if (data.dailyChallenge.progress >= challenge.target) {
      data.dailyChallenge.completed = true;
    }
  }
  
  savePassData(data);
}

export function claimDailyChallengeReward(): boolean {
  const data = getSeasonPassData();
  if (!data.dailyChallenge || !data.dailyChallenge.completed || data.dailyChallenge.claimed) return false;
  
  data.dailyChallenge.claimed = true;
  data.diamonds += 1;
  data.totalDiamondsEarned += 1;
  savePassData(data);
  return true;
}

export function hasDailyChallengeReward(): boolean {
  const data = getSeasonPassData();
  if (!data.dailyChallenge) return false;
  const today = getTodayStr();
  if (data.dailyChallenge.date !== today) return false;
  return data.dailyChallenge.completed && !data.dailyChallenge.claimed;
}
