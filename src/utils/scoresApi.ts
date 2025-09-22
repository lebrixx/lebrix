// Secure API for score submission via Edge Function
import { getLocalIdentity, setUsername, generateDefaultUsername } from './localIdentity';
import { generateDeviceFingerprint } from './deviceFingerprint';
import { supabase } from '@/integrations/supabase/client';

// Constantes de configuration
const SUPABASE_URL = "https://zkhrtvgnzcufplzhophz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHJ0dmduemN1ZnBsemhvcGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjU1NjgsImV4cCI6MjA3NDE0MTU2OH0.3mYkFLKEqJFllX8487LdqnkEFXUw5Y4cZnzlZyfJ-a4";
const FETCH_LIMIT = 100;

// Enhanced anti-spam
let lastSubmitTime = 0;
let gameSessionStart = 0;
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

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile'];

export async function submitScore({ score, mode }: SubmitScoreParams): Promise<boolean> {
  try {
    // Basic client-side validation
    if (typeof score !== 'number' || score < 0) {
      console.warn('Score invalide:', score);
      return false;
    }

    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide:', mode);
      return false;
    }

    // Enhanced anti-spam
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

    // Generate enhanced device fingerprint
    const clientFingerprint = generateDeviceFingerprint();

    // Call the secure Edge Function instead of direct database access
    const { data, error } = await supabase.functions.invoke('submit-score', {
      body: {
        device_id: deviceId,
        username,
        score,
        mode,
        session_start_time: gameSessionStart || now - 10000, // Fallback if not set
        client_fingerprint: clientFingerprint
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      return false;
    }

    if (!data?.success) {
      console.warn('Score submission failed:', data?.error);
      return false;
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

    // Use Supabase client instead of raw fetch for better security
    const { data, error } = await supabase
      .from('scores')
      .select('username,score,created_at')
      .eq('mode', mode)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return [];
  }
}

export function setUsernameForScores(username: string): void {
  setUsername(username);
}

// Function to mark the start of a game session for timing validation
export function startGameSession(): void {
  gameSessionStart = Date.now();
}