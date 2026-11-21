import { ModeID } from '@/constants/modes';
import { trs } from '@/i18n/tr';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'score_in_mode';
  target: number;
  mode: string;
  reward: { coins: number };
}

const scoreGoal = (target: number, mode: string) => trs(`Fais un score de ${target} en ${mode}`, `Score ${target} in ${mode}`, `Consigue ${target} puntos en ${mode}`);

// UNIQUEMENT des défis de score dans un mode spécifique
export const ALL_DAILY_CHALLENGES: DailyChallenge[] = [
  // Chronophase
  { id: 'chronophase_score_10', get title() { return trs("Chrono Débutant", "Chrono Rookie", "Chrono Novato"); }, get description() { return scoreGoal(10, 'Chronophase'); }, type: 'score_in_mode', mode: ModeID.CHRONOPHASE, target: 10, reward: { coins: 16 } },
  { id: 'chronophase_score_20', get title() { return trs("Chrono Apprenti", "Chrono Apprentice", "Chrono Aprendiz"); }, get description() { return scoreGoal(20, 'Chronophase'); }, type: 'score_in_mode', mode: ModeID.CHRONOPHASE, target: 20, reward: { coins: 20 } },
  { id: 'chronophase_score_35', get title() { return trs("Chrono Confirmé", "Chrono Skilled", "Chrono Experto"); }, get description() { return scoreGoal(35, 'Chronophase'); }, type: 'score_in_mode', mode: ModeID.CHRONOPHASE, target: 35, reward: { coins: 30 } },
  { id: 'chronophase_score_60', get title() { return trs("Chrono Pro", "Chrono Pro", "Chrono Pro"); }, get description() { return scoreGoal(60, 'Chronophase'); }, type: 'score_in_mode', mode: ModeID.CHRONOPHASE, target: 60, reward: { coins: 40 } },
  
  // Bloup — new IDs keep historical Ball Balance progress separate.
  { id: 'bloup_score_10', get title() { return trs("Bloup Débutant", "Bloup Rookie", "Bloup Novato"); }, get description() { return scoreGoal(10, 'Bloup'); }, type: 'score_in_mode', mode: ModeID.BLOUP, target: 10, reward: { coins: 16 } },
  { id: 'bloup_score_20', get title() { return trs("Bloup Intermédiaire", "Bloup Intermediate", "Bloup Intermedio"); }, get description() { return scoreGoal(20, 'Bloup'); }, type: 'score_in_mode', mode: ModeID.BLOUP, target: 20, reward: { coins: 20 } },
  { id: 'bloup_score_30', get title() { return trs("Bloup Confirmé", "Bloup Skilled", "Bloup Experto"); }, get description() { return scoreGoal(30, 'Bloup'); }, type: 'score_in_mode', mode: ModeID.BLOUP, target: 30, reward: { coins: 30 } },
  { id: 'bloup_score_45', get title() { return trs("Bloup Expert", "Bloup Expert", "Bloup Maestro"); }, get description() { return scoreGoal(45, 'Bloup'); }, type: 'score_in_mode', mode: ModeID.BLOUP, target: 45, reward: { coins: 46 } },
  
  // Altitude
  { id: 'survie_score_5', get title() { return trs("Altitude Débutant", "Altitude Rookie", "Altitude Novato"); }, get description() { return scoreGoal(5, 'Altitude'); }, type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 5, reward: { coins: 16 } },
  { id: 'survie_score_8', get title() { return trs("Altitude Empileur", "Altitude Stacker", "Altitude Apilador"); }, get description() { return scoreGoal(8, 'Altitude'); }, type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 8, reward: { coins: 26 } },
  { id: 'survie_score_12', get title() { return trs("Altitude Confirmé", "Altitude Skilled", "Altitude Experto"); }, get description() { return scoreGoal(12, 'Altitude'); }, type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 12, reward: { coins: 36 } },
  { id: 'survie_score_15', get title() { return trs("Maître Altitude", "Altitude Master", "Maestro de Altitude"); }, get description() { return scoreGoal(15, 'Altitude'); }, type: 'score_in_mode', mode: ModeID.SURVIE_60S, target: 15, reward: { coins: 50 } },
  
  // Zone mobile
  { id: 'assaut_score_8', get title() { return trs("Pilote Débutant", "Rookie Pilot", "Piloto Novato"); }, get description() { return scoreGoal(8, 'Assaut'); }, type: 'score_in_mode', mode: ModeID.ASSAUT, target: 8, reward: { coins: 20 } },
  { id: 'assaut_score_12', get title() { return trs("Chasseur spatial", "Space Hunter", "Cazador espacial"); }, get description() { return scoreGoal(12, 'Assaut'); }, type: 'score_in_mode', mode: ModeID.ASSAUT, target: 12, reward: { coins: 30 } },
  { id: 'assaut_score_15', get title() { return trs("Pilote Confirmé", "Skilled Pilot", "Piloto Experto"); }, get description() { return scoreGoal(15, 'Assaut'); }, type: 'score_in_mode', mode: ModeID.ASSAUT, target: 15, reward: { coins: 40 } },
  { id: 'assaut_score_20', get title() { return trs("Expert Assaut", "Assault Expert", "Experto en Asalto"); }, get description() { return scoreGoal(20, 'Assaut'); }, type: 'score_in_mode', mode: ModeID.ASSAUT, target: 20, reward: { coins: 50 } },
  
  // Brix Rush
  { id: 'brix_rush_score_5', get title() { return trs("Rush Novice", "Rush Rookie", "Rush Novato"); }, get description() { return scoreGoal(5, 'Brix Rush'); }, type: 'score_in_mode', mode: ModeID.BRIX_RUSH, target: 5, reward: { coins: 20 } },
  { id: 'brix_rush_score_8', get title() { return trs("Rush Habile", "Rush Skillful", "Rush Hábil"); }, get description() { return scoreGoal(8, 'Brix Rush'); }, type: 'score_in_mode', mode: ModeID.BRIX_RUSH, target: 8, reward: { coins: 30 } },
  { id: 'brix_rush_score_10', get title() { return trs("Rush Confirmé", "Rush Skilled", "Rush Experto"); }, get description() { return scoreGoal(10, 'Brix Rush'); }, type: 'score_in_mode', mode: ModeID.BRIX_RUSH, target: 10, reward: { coins: 40 } },
  { id: 'brix_rush_score_15', get title() { return trs("Maître des routes", "Road Master", "Maestro de la carretera"); }, get description() { return scoreGoal(15, 'Brix Rush'); }, type: 'score_in_mode', mode: ModeID.BRIX_RUSH, target: 15, reward: { coins: 56 } },
  
  // Brix Arena
  { id: 'brix_arena_score_3', get title() { return trs("Premier survivant", "First Survivor", "Primer superviviente"); }, get description() { return scoreGoal(3, 'Brix Arena'); }, type: 'score_in_mode', mode: ModeID.BRIX_ARENA, target: 3, reward: { coins: 20 } },
  { id: 'brix_arena_score_5', get title() { return trs("Esquiveur", "Dodger", "Esquivador"); }, get description() { return scoreGoal(5, 'Brix Arena'); }, type: 'score_in_mode', mode: ModeID.BRIX_ARENA, target: 5, reward: { coins: 36 } },
  { id: 'brix_arena_score_8', get title() { return trs("Tactique", "Tactician", "Táctico"); }, get description() { return scoreGoal(8, 'Brix Arena'); }, type: 'score_in_mode', mode: ModeID.BRIX_ARENA, target: 8, reward: { coins: 50 } },
  { id: 'brix_arena_score_10', get title() { return trs("Maître de l’arène", "Arena Master", "Maestro de la arena"); }, get description() { return scoreGoal(10, 'Brix Arena'); }, type: 'score_in_mode', mode: ModeID.BRIX_ARENA, target: 10, reward: { coins: 60 } },
];

export interface DailyChallengeProgress {
  date: string;
  challenges: {
    [challengeId: string]: {
      progress: number;
      completed: boolean;
      claimed: boolean;
    };
  };
  // Meilleur score du jour pour chaque mode
  bestScorePerMode: { [mode: string]: number };
}

// NOUVELLE CLÉ v6 - reset complet
const STORAGE_KEY = 'daily_challenges_v6';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Générateur pseudo-aléatoire déterministe
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Sélectionne 2 défis différents pour aujourd'hui
function getDailyChallengeIndices(date: string): number[] {
  const [year, month, day] = date.split('-').map(Number);
  const seed = Math.abs((year * 31337) ^ (month * 7919) ^ (day * 104729));
  const random = mulberry32(seed);
  
  const indices: number[] = [];
  while (indices.length < 2) {
    const index = Math.floor(random() * ALL_DAILY_CHALLENGES.length);
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

function createEmptyProgress(date: string): DailyChallengeProgress {
  const challenges = getTodaysChallenges();
  
  const progress: DailyChallengeProgress = {
    date,
    challenges: {},
    bestScorePerMode: {}
  };
  
  // Initialiser chaque défi à 0
  challenges.forEach(c => {
    progress.challenges[c.id] = {
      progress: 0,
      completed: false,
      claimed: false
    };
  });
  
  return progress;
}

function isValidProgress(data: any, today: string): data is DailyChallengeProgress {
  if (!data || typeof data !== 'object') return false;
  if (data.date !== today) return false;
  if (typeof data.bestScorePerMode !== 'object' || data.bestScorePerMode === null) return false;
  if (!data.challenges || typeof data.challenges !== 'object') return false;
  return true;
}

export function getDailyChallengeProgress(): DailyChallengeProgress {
  const today = getTodayDate();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidProgress(parsed, today)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[DailyChallenges] Error reading progress:', e);
  }
  
  // Créer une nouvelle progression vide
  const empty = createEmptyProgress(today);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  } catch (e) {
    console.warn('[DailyChallenges] Unable to save fresh progress:', e);
  }
  return empty;
}

function saveProgress(progress: DailyChallengeProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('[DailyChallenges] Unable to save progress:', e);
  }
}

// FONCTION PRINCIPALE - appelée après chaque partie terminée
export function updateDailyChallengeProgress(
  mode: string,
  score: number,
  gameDuration: number
): void {
  // Ignorer les parties trop courtes
  if (gameDuration < 5) {
    console.log('[DailyChallenges] Partie ignorée - durée:', gameDuration, 's');
    return;
  }
  
  // Valider le score
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    console.log('[DailyChallenges] Score invalide:', score);
    return;
  }
  
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  
  console.log('[DailyChallenges] Mode:', mode, '| Score:', score);
  console.log('[DailyChallenges] bestScorePerMode AVANT:', JSON.stringify(progress.bestScorePerMode));
  
  // Mettre à jour le meilleur score du jour pour ce mode
  const currentBest = progress.bestScorePerMode[mode] || 0;
  if (score > currentBest) {
    progress.bestScorePerMode[mode] = score;
    console.log('[DailyChallenges] Nouveau meilleur score pour', mode, ':', score);
  }
  
  console.log('[DailyChallenges] bestScorePerMode APRÈS:', JSON.stringify(progress.bestScorePerMode));
  
  // Évaluer chaque défi du jour
  challenges.forEach(challenge => {
    // S'assurer que le défi existe
    if (!progress.challenges[challenge.id]) {
      progress.challenges[challenge.id] = {
        progress: 0,
        completed: false,
        claimed: false
      };
    }
    
    const challengeData = progress.challenges[challenge.id];
    
    // Si déjà complété, ne rien faire
    if (challengeData.completed) {
      return;
    }
    
    // Le défi concerne-t-il le mode joué ?
    if (challenge.mode !== mode) {
      console.log('[DailyChallenges] Défi', challenge.id, 'pas pour ce mode (', challenge.mode, '!=', mode, ')');
      return;
    }
    
    // Mettre à jour la progression = meilleur score dans ce mode
    const bestScore = progress.bestScorePerMode[mode] || 0;
    challengeData.progress = bestScore;
    
    // Vérifier si complété
    if (bestScore >= challenge.target) {
      challengeData.completed = true;
      console.log('[DailyChallenges] ✅ COMPLÉTÉ:', challenge.id, '(', bestScore, '>=', challenge.target, ')');
    } else {
      console.log('[DailyChallenges] ⏳ En cours:', challenge.id, '(', bestScore, '/', challenge.target, ')');
    }
  });
  
  saveProgress(progress);
}

// Réclamer un défi complété
export function claimDailyChallenge(challengeId: string): number {
  const progress = getDailyChallengeProgress();
  const challenges = getTodaysChallenges();
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (!challenge) return 0;
  
  const challengeData = progress.challenges[challengeId];
  if (!challengeData || !challengeData.completed || challengeData.claimed) {
    return 0;
  }
  
  challengeData.claimed = true;
  saveProgress(progress);
  
  return challenge.reward.coins;
}

// Vérifier s'il y a des récompenses non réclamées
export function hasPendingDailyChallengeRewards(): boolean {
  const progress = getDailyChallengeProgress();
  return Object.values(progress.challenges).some(c => c.completed && !c.claimed);
}

// Reset manuel
export function resetDailyChallenges(): void {
  const today = getTodayDate();
  const empty = createEmptyProgress(today);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
  } catch (e) {
    console.warn('[DailyChallenges] Unable to reset progress:', e);
  }
  console.log('[DailyChallenges] Reset effectué');
}
