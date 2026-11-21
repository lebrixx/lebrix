import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration constants
// Plafond absolu par mode (les meilleurs scores réels sont < 200 en novembre 2026).
const SCORE_LIMITS: Record<string, number> = {
  classic: 2000,
  arc_changeant: 2000,
  survie_60s: 2000,
  zone_mobile: 2000,
  assaut: 2000,
  chronophase: 2000,
  bloup: 2000,
  brix_rush: 2000,
  brix_arena: 2000,
  zone_traitresse: 2000, // Accept older installed app versions; current rankings exclude this identity.
  memoire_expert: 2000
};

// Rythme maximal réaliste (points par seconde de partie), volontairement très large.
// Brix Arena : 1 point / 3 s. Brix Rush : 1 colonne par saut (110 ms mini). Assaut : ~2 points / 3 éliminations.
const MAX_POINTS_PER_SECOND: Record<string, number> = {
  brix_arena: 0.5,
  assaut: 2,
  chronophase: 3,
  bloup: 3,
  survie_60s: 4,
  brix_rush: 6,
};
const DEFAULT_POINTS_PER_SECOND = 5; // anciens modes encore envoyés par d'anciennes versions de l'app
const SCORE_HEADROOM = 30;            // boost « départ à 20 » + marge
const CLOCK_GRACE_SECONDS = 60;       // horloge du téléphone en avance sur le serveur

/**
 * Le score est-il atteignable dans la durée de la partie ?
 * L'app envoie toujours session_start_time (au pire « maintenant − 10 s ») : une valeur absente est traitée pareil.
 * Une horloge de téléphone très en avance ne donne pas de verdict (on ne pénalise pas un joueur honnête).
 */
function isPlausibleForDuration(mode: string, score: number, sessionStart: unknown, now = Date.now()): boolean {
  let start = Number(sessionStart);
  if (!Number.isFinite(start) || start <= 0) start = now - 10_000;
  const seconds = (now - start) / 1000;
  if (seconds < -CLOCK_GRACE_SECONDS) return true; // horloge du téléphone manifestement en avance
  const rate = MAX_POINTS_PER_SECOND[mode] ?? DEFAULT_POINTS_PER_SECOND;
  return score <= SCORE_HEADROOM + rate * (Math.max(0, seconds) + CLOCK_GRACE_SECONDS);
}

// Client Supabase (service role) : typé souplement, le schéma n'est pas généré pour les fonctions.
// deno-lint-ignore no-explicit-any
type Db = any;

// Limite de fréquence persistante (table rate_limits), en plus de la limite en mémoire.
const PERSISTENT_WINDOW_MS = 10 * 60 * 1000;
const PERSISTENT_MAX_SUBMISSIONS = 40;

async function overPersistentLimit(supabase: Db, deviceId: string): Promise<boolean> {
  const key = `score:${deviceId}`.slice(0, 200);
  const now = new Date();
  const { data } = await supabase.from('rate_limits').select('submission_count, window_start').eq('fingerprint', key).maybeSingle();
  const windowStart = data?.window_start ? new Date(data.window_start) : null;
  const inWindow = windowStart && now.getTime() - windowStart.getTime() < PERSISTENT_WINDOW_MS;
  const count = inWindow ? (data?.submission_count ?? 0) : 0;
  if (count >= PERSISTENT_MAX_SUBMISSIONS) return true;
  await supabase.from('rate_limits').upsert({
    fingerprint: key,
    submission_count: count + 1,
    window_start: inWindow ? data!.window_start : now.toISOString(),
    last_submission: now.toISOString(),
  }, { onConflict: 'fingerprint' });
  return false;
}

// Décorations qui existent dans le jeu : au plus un emblème et une couleur.
const EMBLEMS = new Set(['star', 'fire', 'sparkle', 'crown', 'diamond', 'trophy', 'dragon']);
const COLORS = new Set(['purple_name', 'pulse_name', 'gold_pulse_name', 'rainbow_name']);

/** null = aucune décoration, undefined = valeur invalide (ignorée, sans bloquer le score). */
function normalizeDecorations(value: unknown): string | null | undefined {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 40) return undefined;
  const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) return undefined;
  const emblems = parts.filter((p) => EMBLEMS.has(p));
  const colors = parts.filter((p) => COLORS.has(p));
  if (emblems.length + colors.length !== parts.length || emblems.length > 1 || colors.length > 1) return undefined;
  return [...emblems, ...colors].join(',') || null;
}

/**
 * Applique la décoration. Seul l'appareil « propriétaire » du pseudo (celui qui l'a utilisé en premier)
 * peut la propager à toutes les lignes du pseudo ; un autre appareil ne modifie que ses propres lignes.
 */
async function syncDecorations(supabase: Db, deviceId: string, username: string, decorations: string | null) {
  const { data: first } = await supabase
    .from('scores')
    .select('device_id')
    .ilike('username', username)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  let query = supabase.from('scores').update({ decorations }).ilike('username', username);
  if (first && first.device_id !== deviceId) query = query.eq('device_id', deviceId);
  await query;
}

const RATE_LIMIT_WINDOW = 15000;
const MAX_SUBMISSIONS_PER_WINDOW = 20;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const processedSubmissions = new Set<string>();
const SUBMISSION_ID_TTL = 60000;

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'assaut', 'brix_rush', 'brix_arena', 'chronophase', 'bloup', 'zone_traitresse', 'memoire_expert'];

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getFirstOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, username, score, mode, session_start_time, client_fingerprint, decorations: rawDecorations, submission_id, username_changed } = await req.json();
    // Décorations validées ; une valeur inconnue est ignorée (le score, lui, est traité normalement).
    const decorations = rawDecorations === undefined ? undefined : normalizeDecorations(rawDecorations);

    console.log('Score submission attempt:', { device_id, username, score, mode, submission_id, username_changed });

    // Idempotence check
    if (submission_id && processedSubmissions.has(submission_id)) {
      return new Response(
        JSON.stringify({ success: true, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation
    if (!device_id || !username || typeof score !== 'number' || !mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9._-]{3,16}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_MODES.includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid game mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score validation
    const maxScore = SCORE_LIMITS[mode];
    if (score < 1 || score > maxScore) {
      return new Response(
        JSON.stringify({ error: 'Invalid score range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score impossible dans la durée de la partie → refusé.
    // Réponse 200 (success: false) : l'app abandonne ce score au lieu de le renvoyer en boucle.
    if (!isPlausibleForDuration(mode, score, session_start_time)) {
      console.warn('Implausible score rejected:', { mode, score, session_start_time });
      return new Response(
        JSON.stringify({ success: false, error: 'implausible_score' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In-memory rate limiting
    const fingerprint = `${device_id}_${client_fingerprint || 'unknown'}`;
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(fingerprint);

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= MAX_SUBMISSIONS_PER_WINDOW) {
          return new Response(
            JSON.stringify({ error: 'Too many submissions, please wait' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        rateLimitData.count++;
      } else {
        rateLimitData.count = 1;
        rateLimitData.resetTime = now + RATE_LIMIT_WINDOW;
      }
    } else {
      rateLimitMap.set(fingerprint, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    if (await overPersistentLimit(supabase, device_id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'rate_limited' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== CONSOLIDATION: Only when username actually changed =====
    if (username_changed) {
      console.log('Username changed — running consolidation for device', device_id);

      const { data: oldUsernameEntries } = await supabase
        .from('scores')
        .select('id, username, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, monthly_score, monthly_updated_at, decorations')
        .eq('device_id', device_id)
        .not('username', 'ilike', username);

      if (oldUsernameEntries && oldUsernameEntries.length > 0) {
        const { data: currentEntries } = await supabase
          .from('scores')
          .select('id, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, monthly_score, monthly_updated_at, decorations')
          .eq('device_id', device_id)
          .ilike('username', username);

        const consolidated = new Map<string, {
          best_score: number;
          weekly_score: number;
          weekly_updated_at: string | null;
          previous_weekly_score: number;
          previous_weekly_updated_at: string | null;
          monthly_score: number;
          monthly_updated_at: string | null;
          decorations: string | null;
        }>();

        for (const entry of (currentEntries || [])) {
          consolidated.set(entry.mode, {
            best_score: entry.best_score,
            weekly_score: entry.weekly_score || 0,
            weekly_updated_at: entry.weekly_updated_at,
            previous_weekly_score: entry.previous_weekly_score || 0,
            previous_weekly_updated_at: entry.previous_weekly_updated_at,
            monthly_score: entry.monthly_score || 0,
            monthly_updated_at: entry.monthly_updated_at,
            decorations: entry.decorations,
          });
        }

        for (const entry of oldUsernameEntries) {
          const existing = consolidated.get(entry.mode);
          if (existing) {
            existing.best_score = Math.max(existing.best_score, entry.best_score);
            existing.weekly_score = Math.max(existing.weekly_score, entry.weekly_score || 0);
            if (!existing.weekly_updated_at || (entry.weekly_updated_at && entry.weekly_updated_at > existing.weekly_updated_at)) {
              existing.weekly_updated_at = entry.weekly_updated_at;
            }
            existing.previous_weekly_score = Math.max(existing.previous_weekly_score, entry.previous_weekly_score || 0);
            if (!existing.previous_weekly_updated_at || (entry.previous_weekly_updated_at && entry.previous_weekly_updated_at > existing.previous_weekly_updated_at)) {
              existing.previous_weekly_updated_at = entry.previous_weekly_updated_at;
            }
            existing.monthly_score = Math.max(existing.monthly_score, entry.monthly_score || 0);
            if (!existing.monthly_updated_at || (entry.monthly_updated_at && entry.monthly_updated_at > existing.monthly_updated_at)) {
              existing.monthly_updated_at = entry.monthly_updated_at;
            }
          } else {
            consolidated.set(entry.mode, {
              best_score: entry.best_score,
              weekly_score: entry.weekly_score || 0,
              weekly_updated_at: entry.weekly_updated_at,
              previous_weekly_score: entry.previous_weekly_score || 0,
              previous_weekly_updated_at: entry.previous_weekly_updated_at,
              monthly_score: entry.monthly_score || 0,
              monthly_updated_at: entry.monthly_updated_at,
              decorations: entry.decorations,
            });
          }
        }

        const idsToKeep = new Set<string>();
        for (const [entryMode, data] of consolidated.entries()) {
          const { data: upsertData, error: upsertError } = await supabase
            .from('scores')
            .upsert({
              device_id,
              username,
              mode: entryMode,
              best_score: data.best_score,
              weekly_score: data.weekly_score,
              weekly_updated_at: data.weekly_updated_at || new Date().toISOString(),
              previous_weekly_score: data.previous_weekly_score,
              previous_weekly_updated_at: data.previous_weekly_updated_at,
              monthly_score: data.monthly_score,
              monthly_updated_at: data.monthly_updated_at,
              decorations: decorations !== undefined ? (decorations || null) : data.decorations,
            }, { onConflict: 'device_id,username,mode' })
            .select('id');

          if (upsertError) {
            console.error(`Consolidation upsert failed for ${entryMode}:`, upsertError);
          } else if (upsertData?.[0]) {
            idsToKeep.add(upsertData[0].id);
          }
        }

        for (const entry of oldUsernameEntries) {
          if (!idsToKeep.has(entry.id)) {
            await supabase.from('scores').delete().eq('id', entry.id);
            console.log(`Deleted old entry: ${entry.username}/${entry.mode}`);
          }
        }

        console.log(`Consolidation done: ${consolidated.size} modes merged`);
      }
    }

    // ===== Handle the current score submission =====
    const monday = getMondayOfCurrentWeek();
    const firstOfMonth = getFirstOfCurrentMonth();

    // Fetch existing score for this mode
    const { data: existingScore } = await supabase
      .from('scores')
      .select('best_score, weekly_score, weekly_updated_at, monthly_score, monthly_updated_at')
      .eq('device_id', device_id)
      .ilike('username', username)
      .eq('mode', mode)
      .limit(1)
      .single();

    let best_score = score;
    let weekly_score = score;
    let monthly_score = score;

    if (existingScore) {
      best_score = Math.max(score, existingScore.best_score);

      // Weekly logic (unchanged)
      const weeklyUpdatedAt = existingScore.weekly_updated_at ? new Date(existingScore.weekly_updated_at) : null;
      const isCurrentWeek = weeklyUpdatedAt && weeklyUpdatedAt >= monday;

      if (isCurrentWeek) {
        weekly_score = Math.max(score, existingScore.weekly_score || 0);
      } else {
        if (existingScore.weekly_score > 0 && weeklyUpdatedAt) {
          await supabase
            .from('scores')
            .update({
              previous_weekly_score: existingScore.weekly_score,
              previous_weekly_updated_at: existingScore.weekly_updated_at
            })
            .eq('device_id', device_id)
            .ilike('username', username)
            .eq('mode', mode);
        }
        weekly_score = score;
      }

      // Monthly logic
      const monthlyUpdatedAt = existingScore.monthly_updated_at ? new Date(existingScore.monthly_updated_at) : null;
      const isCurrentMonth = monthlyUpdatedAt && monthlyUpdatedAt >= firstOfMonth;

      if (isCurrentMonth) {
        monthly_score = Math.max(score, existingScore.monthly_score || 0);
      } else {
        // New month: reset monthly score (no archiving needed, it just resets)
        monthly_score = score;
      }

      // Check if anything actually improved
      const bestImproved = score > existingScore.best_score;
      const weeklyImproved = !isCurrentWeek || score > (existingScore.weekly_score || 0);
      const monthlyImproved = !isCurrentMonth || score > (existingScore.monthly_score || 0);

      if (!bestImproved && !weeklyImproved && !monthlyImproved) {
        console.log(`No improvement for ${username}: best=${existingScore.best_score}, weekly=${existingScore.weekly_score}, monthly=${existingScore.monthly_score}, submitted=${score}`);

        if (decorations !== undefined) {
          await syncDecorations(supabase, device_id, username, decorations);
        }

        return new Response(
          JSON.stringify({ success: true, updated: false, reason: 'no_improvement', current_best: existingScore.best_score }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sync decorations across all entries for this username
    if (decorations !== undefined) {
      await syncDecorations(supabase, device_id, username, decorations);
    }

    // Upsert the score
    const { error } = await supabase
      .from('scores')
      .upsert({
        device_id,
        username,
        best_score,
        weekly_score,
        weekly_updated_at: new Date().toISOString(),
        monthly_score,
        monthly_updated_at: new Date().toISOString(),
        mode,
        decorations: decorations === undefined ? (existingScore ? undefined : null) : decorations,
        created_at: existingScore ? undefined : new Date().toISOString()
      }, { onConflict: 'device_id,username,mode' })
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Score saved:', { username, mode, best_score, weekly_score, monthly_score });

    // Track submission_id for idempotence
    if (submission_id) {
      processedSubmissions.add(submission_id);
      setTimeout(() => processedSubmissions.delete(submission_id), SUBMISSION_ID_TTL);
      if (processedSubmissions.size > 1000) {
        const first = processedSubmissions.values().next().value;
        if (first) processedSubmissions.delete(first);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: true, best_score, weekly_score, monthly_score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-score function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
