import { ModeID } from '@/constants/modes';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'play_games' | 'score_in_mode' | 'total_score' | 'play_mode' | 'direction_changes' | 'speed_reached';
  target: number;
  mode?: string; // Mode spécifique si applicable
  reward: { coins: number };
}

// 30 défis quotidiens différents
export const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  // Défis de parties jouées
  { id: 'play_3_games', title: 'Échauffement', description: 'Joue 3 parties', type: 'play_games', target: 3, reward: { coins: 15 } },
  { id: 'play_5_games', title: 'Joueur actif', description: 'Joue 5 parties', type: 'play_games', target: 5, reward: { coins: 25 } },
  { id: 'play_10_games', title: 'Marathon', description: 'Joue 10 parties', type: 'play_games', target: 10, reward: { coins: 50 } },
  
  // Défis par mode - Classique
  { id: 'classic_score_15', title: 'Classique Apprenti', description: 'Fais un score de 15 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 15, reward: { coins: 20 } },
  { id: 'classic_score_25', title: 'Classique Pro', description: 'Fais un score de 25 en Classique', type: 'score_in_mode', mode: ModeID.CLASSIC, target: 25, reward: { coins: 35 } },
  { id: 'play_classic_3', title: 'Fan du Classique', description: 'Joue 3 parties en Classique', type: 'play_mode', mode: ModeID.CLASSIC, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Arc changeant
  { id: 'arc_score_10', title: 'Arc Débutant', description: 'Fais un score de 10 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 10, reward: { coins: 20 } },
  { id: 'arc_score_20', title: 'Arc Expert', description: 'Fais un score de 20 en Arc changeant', type: 'score_in_mode', mode: ModeID.ARC_CHANGEANT, target: 20, reward: { coins: 40 } },
  { id: 'play_arc_3', title: 'Explorateur Arc', description: 'Joue 3 parties en Arc changeant', type: 'play_mode', mode: ModeID.ARC_CHANGEANT, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Survie 30s
  { id: 'survie_score_8', title: 'Survivant', description: 'Fais un score de 8 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 8, reward: { coins: 25 } },
  { id: 'survie_score_15', title: 'Maître Survie', description: 'Fais un score de 15 en Survie 30s', type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 15, reward: { coins: 45 } },
  { id: 'play_survie_3', title: 'Adrénaline', description: 'Joue 3 parties en Survie 30s', type: 'play_mode', mode: ModeID.SURVIE_60S, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Zone mobile
  { id: 'mobile_score_10', title: 'Zone Nomade', description: 'Fais un score de 10 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 10, reward: { coins: 25 } },
  { id: 'mobile_score_20', title: 'Chasseur Mobile', description: 'Fais un score de 20 en Zone mobile', type: 'score_in_mode', mode: ModeID.ZONE_MOBILE, target: 20, reward: { coins: 45 } },
  { id: 'play_mobile_3', title: 'Zone en mouvement', description: 'Joue 3 parties en Zone mobile', type: 'play_mode', mode: ModeID.ZONE_MOBILE, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Zone traîtresse
  { id: 'traitresse_score_8', title: 'Détecteur', description: 'Fais un score de 8 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 8, reward: { coins: 30 } },
  { id: 'traitresse_score_15', title: 'Démineur', description: 'Fais un score de 15 en Zone traîtresse', type: 'score_in_mode', mode: ModeID.ZONE_TRAITRESSE, target: 15, reward: { coins: 50 } },
  { id: 'play_traitresse_3', title: 'Courageux', description: 'Joue 3 parties en Zone traîtresse', type: 'play_mode', mode: ModeID.ZONE_TRAITRESSE, target: 3, reward: { coins: 20 } },
  
  // Défis par mode - Mémoire Expert
  { id: 'memoire_score_5', title: 'Mémoire courte', description: 'Fais un score de 5 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 5, reward: { coins: 30 } },
  { id: 'memoire_score_10', title: 'Mémoire eidétique', description: 'Fais un score de 10 en Mémoire Expert', type: 'score_in_mode', mode: ModeID.MEMOIRE_EXPERT, target: 10, reward: { coins: 55 } },
  { id: 'play_memoire_3', title: 'Entraînement mental', description: 'Joue 3 parties en Mémoire Expert', type: 'play_mode', mode: ModeID.MEMOIRE_EXPERT, target: 3, reward: { coins: 20 } },
  
  // Défis mixtes
  { id: 'play_2_modes', title: 'Polyvalent', description: 'Joue dans 2 modes différents', type: 'play_games', target: 2, reward: { coins: 25 } },
  { id: 'total_score_30', title: 'Cumulateur', description: 'Cumule 30 points au total aujourd\'hui', type: 'total_score', target: 30, reward: { coins: 30 } },
  { id: 'total_score_50', title: 'Collectionneur', description: 'Cumule 50 points au total aujourd\'hui', type: 'total_score', target: 50, reward: { coins: 45 } },
  { id: 'total_score_100', title: 'Accumulateur', description: 'Cumule 100 points au total aujourd\'hui', type: 'total_score', target: 100, reward: { coins: 75 } },
  
  // Défis simples
  { id: 'first_game', title: 'Premier pas', description: 'Joue ta première partie du jour', type: 'play_games', target: 1, reward: { coins: 10 } },
  { id: 'score_any_10', title: 'Décollage', description: 'Fais un score de 10 dans n\'importe quel mode', type: 'total_score', target: 10, reward: { coins: 15 } },
  { id: 'play_7_games', title: 'Semaine en un jour', description: 'Joue 7 parties', type: 'play_games', target: 7, reward: { coins: 35 } },
  { id: 'play_any_mode_5', title: 'Découvreur', description: 'Joue 5 parties dans n\'importe quel mode', type: 'play_games', target: 5, reward: { coins: 30 } },
  { id: 'score_any_20', title: 'Bonne performance', description: 'Fais un score de 20 dans n\'importe quel mode', type: 'total_score', target: 20, reward: { coins: 25 } },
];

export interface DailyChallengeProgress {
  date: string; // YYYY-MM-DD
  challenges: {
    [challengeId: string]: {
      progress: number;
      completed: boolean;
      claimed: boolean;
    };
  };
  gamesPlayedToday: number;
  totalScoreToday: number;
  modesPlayedToday: string[];
  gamesPerModeToday: { [mode: string]: number };
  bestScorePerModeToday: { [mode: string]: number };
}

const DAILY_CHALLENGES_KEY = 'daily_challenges_progress';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Utilise une seed basée sur la date pour obtenir 3 défis différents chaque jour
function getDailyChallengeIndices(date: string): number[] {
  // Convertir la date en nombre pour le seed
  const dateParts = date.split('-');
  const seed = parseInt(dateParts[0]) * 10000 + parseInt(dateParts[1]) * 100 + parseInt(dateParts[2]);
  
  // Générateur pseudo-aléatoire simple
  const indices: number[] = [];
  let current = seed;
  
  while (indices.length < 3) {
    current = (current * 1103515245 + 12345) % 2147483648;
    const index = current % ALL_DAILY_CHALLENGES.length;
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }
  
  return indices;
}

export function getTodaysChallenges(): DailyChallenge[] {
  const today = getTodayDate();
  const indices = getDailyChallengeIndices(today);
  return indices.map(i => ALL_DAILY_CHALLENGES[i]);
}

export function getDailyChallengeProgress(): DailyChallengeProgress {
  const saved = localStorage.getItem(DAILY_CHALLENGES_KEY);
  const today = getTodayDate();
  
  if (saved) {
    const parsed: DailyChallengeProgress = JSON.parse(saved);
    // Si c'est un nouveau jour, réinitialiser
    if (parsed.date !== today) {
      return createFreshProgress(today);
    }
    return parsed;
  }
  
  return createFreshProgress(today);
}

function createFreshProgress(date: string): DailyChallengeProgress {
  const challenges = getTodaysChallenges();
  const progress: DailyChallengeProgress = {
    date,
    challenges: {},
    gamesPlayedToday: 0,
    totalScoreToday: 0,
    modesPlayedToday: [],
    gamesPerModeToday: {},
    bestScorePerModeToday: {}
  };
  
  challenges.forEach(c => {
    progress.challenges[c.id] = { progress: 0, completed: false, claimed: false };
  });
  
  return progress;
}

export function saveDailyChallengeProgress(progress: DailyChallengeProgress): void {
  localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(progress));
}

export function updateDailyChallengeProgress(
  mode: string,
  score: number,
  gameDuration: number
): void {
  // Ne compter que les parties de plus de 5 secondes
  if (gameDuration < 5) return;
  
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  
  // Mettre à jour les statistiques du jour
  progress.gamesPlayedToday++;
  progress.totalScoreToday += score;
  
  if (!progress.modesPlayedToday.includes(mode)) {
    progress.modesPlayedToday.push(mode);
  }
  
  progress.gamesPerModeToday[mode] = (progress.gamesPerModeToday[mode] || 0) + 1;
  progress.bestScorePerModeToday[mode] = Math.max(
    progress.bestScorePerModeToday[mode] || 0,
    score
  );
  
  // Vérifier chaque défi
  challenges.forEach(challenge => {
    const challengeProgress = progress.challenges[challenge.id];
    if (!challengeProgress || challengeProgress.completed) return;
    
    let newProgress = 0;
    
    switch (challenge.type) {
      case 'play_games':
        newProgress = progress.gamesPlayedToday;
        break;
      case 'score_in_mode':
        if (challenge.mode) {
          newProgress = progress.bestScorePerModeToday[challenge.mode] || 0;
        }
        break;
      case 'total_score':
        newProgress = progress.totalScoreToday;
        break;
      case 'play_mode':
        if (challenge.mode) {
          newProgress = progress.gamesPerModeToday[challenge.mode] || 0;
        }
        break;
    }
    
    challengeProgress.progress = newProgress;
    
    if (newProgress >= challenge.target && !challengeProgress.completed) {
      challengeProgress.completed = true;
    }
  });
  
  saveDailyChallengeProgress(progress);
}

export function claimDailyChallenge(challengeId: string): number {
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (!challenge) return 0;
  
  const challengeProgress = progress.challenges[challengeId];
  if (!challengeProgress || !challengeProgress.completed || challengeProgress.claimed) {
    return 0;
  }
  
  challengeProgress.claimed = true;
  saveDailyChallengeProgress(progress);
  
  return challenge.reward.coins;
}

export function hasPendingDailyChallengeRewards(): boolean {
  const progress = getDailyChallengeProgress();
  
  return Object.values(progress.challenges).some(
    c => c.completed && !c.claimed
  );
}
