import { BoostType } from '@/types/boosts';

// Système de récompenses journalières
export interface DailyReward {
  day: number;
  coins: number;
  theme?: string;
  boostId?: BoostType;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  currentStreak: number;
  totalClaimed: number;
  claimedToday: boolean;
}

const DAILY_REWARDS_KEY = 'lucky_stop_daily_rewards';

export function getDailyRewardState(): DailyRewardState {
  const saved = localStorage.getItem(DAILY_REWARDS_KEY);
  if (!saved) {
    return {
      lastClaimDate: null,
      currentStreak: 0,
      totalClaimed: 0,
      claimedToday: false
    };
  }
  return JSON.parse(saved);
}

export function saveDailyRewardState(state: DailyRewardState): void {
  localStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(state));
}

export function isNewDay(lastDate: string | null): boolean {
  if (!lastDate) return true;
  
  const today = new Date().toDateString();
  const lastClaimDate = new Date(lastDate).toDateString();
  
  return today !== lastClaimDate;
}

export function canClaimReward(): boolean {
  const state = getDailyRewardState();
  return !state.claimedToday && isNewDay(state.lastClaimDate);
}

// Liste des boosts disponibles pour les récompenses aléatoires
const BOOST_OPTIONS: BoostType[] = ['shield', 'bigger_zone', 'start_20'];

function getRandomBoost(): BoostType {
  return BOOST_OPTIONS[Math.floor(Math.random() * BOOST_OPTIONS.length)];
}

export function getNextReward(): DailyReward {
  const state = getDailyRewardState();
  const nextDay = Math.min(state.currentStreak + 1, 7);
  
  if (nextDay === 7) {
    return {
      day: 7,
      coins: 10,
      theme: 'theme-royal'
    };
  }
  
  // Jours 2 et 5: boost aléatoire au lieu de coins
  if (nextDay === 2 || nextDay === 5) {
    return {
      day: nextDay,
      coins: 0,
      boostId: getRandomBoost()
    };
  }
  
  return {
    day: nextDay,
    coins: 10
  };
}

export function claimDailyReward(): { reward: DailyReward; newState: DailyRewardState } | null {
  const state = getDailyRewardState();
  
  if (!canClaimReward()) {
    return null;
  }
  
  const today = new Date().toISOString();
  const isConsecutive = state.lastClaimDate && 
    new Date(today).getTime() - new Date(state.lastClaimDate).getTime() <= 2 * 24 * 60 * 60 * 1000;
  
  const newStreak = isConsecutive ? Math.min(state.currentStreak + 1, 7) : 1;
  
  // Déterminer la récompense selon le jour
  let reward: DailyReward;
  if (newStreak === 7) {
    reward = {
      day: newStreak,
      coins: 10,
      theme: 'theme-royal'
    };
  } else if (newStreak === 2 || newStreak === 5) {
    reward = {
      day: newStreak,
      coins: 0,
      boostId: getRandomBoost()
    };
  } else {
    reward = {
      day: newStreak,
      coins: 10
    };
  }
  
  const newState: DailyRewardState = {
    lastClaimDate: today,
    currentStreak: newStreak,
    totalClaimed: state.totalClaimed + 1,
    claimedToday: true
  };
  
  saveDailyRewardState(newState);
  
  return { reward, newState };
}

export function resetDayIfNeeded(): void {
  const state = getDailyRewardState();
  if (isNewDay(state.lastClaimDate)) {
    const newState = { ...state, claimedToday: false };
    saveDailyRewardState(newState);
  }
}