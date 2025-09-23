// Système de récompenses journalières
export interface DailyReward {
  day: number;
  coins: number;
  theme?: string;
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
  const reward = {
    day: newStreak,
    coins: 10,
    ...(newStreak === 7 ? { theme: 'theme-royal' } : {})
  };
  
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