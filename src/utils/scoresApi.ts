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
  weekly_updated_at?: string;
}

export interface SubmitScoreParams {
  score: number;
  mode: string;
}

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert'];

export async function submitScore({ score, mode }: SubmitScoreParams): Promise<boolean> {
  try {
    // Basic client-side validation
    if (typeof score !== 'number' || score < 2) {
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
    console.log('Appel Edge Function avec:', { deviceId, username, score, mode });
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

    // Use Supabase client to fetch from scores table (best_score for global)
    // RLS policies ensure device_id is not exposed to public
    const { data, error } = await supabase
      .from('scores')
      .select('username,best_score,created_at')
      .eq('mode', mode)
      .order('best_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return (data || []).map(entry => ({
      username: entry.username,
      score: entry.best_score,
      created_at: entry.created_at
    }));

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return [];
  }
}

export async function fetchWeeklyTop(mode: string, limit: number = FETCH_LIMIT): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchWeeklyTop:', mode);
      return [];
    }

    // Calculer le début de la semaine (lundi 00:00)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('scores')
      .select('username,weekly_score,weekly_updated_at')
      .eq('mode', mode)
      .gte('weekly_updated_at', monday.toISOString())
      .order('weekly_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }

    return (data || []).map(entry => ({
      username: entry.username,
      score: entry.weekly_score,
      created_at: entry.weekly_updated_at || entry.weekly_updated_at
    }));

  } catch (error) {
    console.error('Erreur lors de la récupération du classement hebdomadaire:', error);
    return [];
  }
}

export async function fetchPreviousWeekTop(mode: string, limit: number = 5): Promise<Score[]> {
  try {
    if (!VALID_MODES.includes(mode)) {
      console.warn('Mode invalide pour fetchPreviousWeekTop:', mode);
      return [];
    }

    // Calculer le début et fin de la semaine précédente
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(now);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const previousMonday = new Date(currentMonday);
    previousMonday.setDate(currentMonday.getDate() - 7);
    
    const previousSunday = new Date(previousMonday);
    previousSunday.setDate(previousMonday.getDate() + 6);
    previousSunday.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('scores')
      .select('username,weekly_score,weekly_updated_at')
      .eq('mode', mode)
      .gte('weekly_updated_at', previousMonday.toISOString())
      .lte('weekly_updated_at', previousSunday.toISOString())
      .order('weekly_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching previous week leaderboard:', error);
      return [];
    }

    return (data || []).map(entry => ({
      username: entry.username,
      score: entry.weekly_score,
      created_at: entry.weekly_updated_at || entry.weekly_updated_at
    }));

  } catch (error) {
    console.error('Erreur lors de la récupération du classement de la semaine précédente:', error);
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