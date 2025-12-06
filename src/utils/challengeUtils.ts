import { ModeID } from '@/constants/modes';
import { hasPendingDailyChallengeRewards } from './dailyChallenges';

interface ChallengeProgress {
  mode: string;
  currentLevel: number;
  pendingRewards: number[];
  lastCheckedScore: number;
}

interface GamesPlayedProgress {
  currentLevel: number;
  pendingRewards: string[];
  lastCheckedGames: number;
}

// Vérifier s'il y a des défis avec des récompenses à réclamer
export function hasPendingChallengeRewards(): boolean {
  // Vérifier les défis quotidiens
  if (hasPendingDailyChallengeRewards()) {
    return true;
  }

  // Vérifier les défis par mode
  const challengeProgress = localStorage.getItem('challengeProgress');
  if (challengeProgress) {
    try {
      const progress: Record<string, ChallengeProgress> = JSON.parse(challengeProgress);
      const hasModeRewards = Object.values(progress).some(p => p.pendingRewards && p.pendingRewards.length > 0);
      if (hasModeRewards) return true;
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Vérifier le défi "Parties jouées"
  const gamesProgress = localStorage.getItem('gamesPlayedProgress');
  if (gamesProgress) {
    try {
      const progress: GamesPlayedProgress = JSON.parse(gamesProgress);
      if (progress.pendingRewards && progress.pendingRewards.length > 0) {
        return true;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return false;
}