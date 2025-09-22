// API REST pour les scores sans authentification
import { getLocalIdentity, setUsername, generateDefaultUsername } from './localIdentity';

// Constantes de configuration
const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";
const TABLE = "scores";
const SCORE_CAP = 9999;
const FETCH_LIMIT = 100;

// Anti-spam: timestamp du dernier submit
let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 3000; // 3 secondes

export interface Score {
  username: string;
  score: number;
  created_at: string;
}

export interface SubmitScoreParams {
  score: number;
  mode: string;
}

const VALID_MODES = ['arc_changeant', 'survie_60s', 'zone_mobile'];

export async function submitScore({ score, mode }: SubmitScoreParams): Promise<boolean> {
  try {
    // Validations côté client
    if (typeof score !== 'number' || score < 0 || score > SCORE_CAP) {
      console.warn('Score invalide:', score);
      return false;
    }

    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide:', mode);
      return false;
    }

    // Anti-spam
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      console.warn('Trop de submissions rapides, attendre', SUBMIT_COOLDOWN - (now - lastSubmitTime), 'ms');
      return false;
    }

    const identity = getLocalIdentity();
    let { username } = identity;
    const { deviceId } = identity;

    // Si pas de pseudo, demander à l'utilisateur de le définir
    if (!username) {
      throw new Error('USERNAME_REQUIRED');
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON,
        "Authorization": `Bearer ${SUPABASE_ANON}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        device_id: deviceId,
        username,
        score,
        mode
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    lastSubmitTime = now;
    return true;

  } catch (error) {
    if (error instanceof Error && error.message === 'USERNAME_REQUIRED') {
      throw error; // Re-throw pour que l'UI puisse gérer
    }
    console.error('Erreur lors de la soumission du score:', error);
    return false;
  }
}

export async function fetchTop(mode: string, limit: number = FETCH_LIMIT): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchTop:', mode);
      return [];
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?mode=eq.${mode}&select=username,score,created_at&order=score.desc&limit=${limit}`,
      {
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data || [];

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return [];
  }
}

export function setUsernameForScores(username: string): void {
  setUsername(username);
}