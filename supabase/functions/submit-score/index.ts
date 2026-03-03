import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration constants
const SCORE_LIMITS: Record<string, number> = {
  classic: 10000,
  arc_changeant: 8000,
  survie_60s: 6000,
  zone_mobile: 7000,
  zone_traitresse: 8000,
  memoire_expert: 5000
};

const RATE_LIMIT_WINDOW = 15000;
const MAX_SUBMISSIONS_PER_WINDOW = 100;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const processedSubmissions = new Set<string>();
const SUBMISSION_ID_TTL = 60000;

const VALID_MODES = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert'];

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
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

    const { device_id, username, score, mode, session_start_time, client_fingerprint, decorations, submission_id } = await req.json();

    console.log('Score submission attempt:', { device_id, username, score, mode, submission_id });

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
    if (score < 2 || score > maxScore) {
      return new Response(
        JSON.stringify({ error: 'Invalid score range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
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

    // DB rate limit check
    const { data: recentScores } = await supabase
      .from('scores')
      .select('created_at')
      .eq('device_id', device_id)
      .gte('created_at', new Date(now - RATE_LIMIT_WINDOW).toISOString())
      .order('created_at', { ascending: false });

    if (recentScores && recentScores.length >= MAX_SUBMISSIONS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: 'Too many recent submissions' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== CONSOLIDATION: Gather ALL entries belonging to this player =====
    // Step 1: Find entries on OTHER devices with the same username (reinstall/cache clear)
    const { data: otherDeviceEntries } = await supabase
      .from('scores')
      .select('id, device_id, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, decorations')
      .ilike('username', username)
      .neq('device_id', device_id);

    // Step 2: Find entries on THIS device with a DIFFERENT username (username change)
    const { data: oldUsernameEntries } = await supabase
      .from('scores')
      .select('id, username, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, decorations')
      .eq('device_id', device_id)
      .not('username', 'ilike', username);

    // Step 3: Find entries on THIS device with the CURRENT username
    const { data: currentEntries } = await supabase
      .from('scores')
      .select('id, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, decorations')
      .eq('device_id', device_id)
      .ilike('username', username);

    // Build a consolidated map: mode → best scores from ALL sources
    const consolidated = new Map<string, {
      best_score: number;
      weekly_score: number;
      weekly_updated_at: string | null;
      previous_weekly_score: number;
      previous_weekly_updated_at: string | null;
      decorations: string | null;
      existing_id: string | null; // ID of the entry to keep (on current device with current username)
    }>();

    // Seed with current device + current username entries
    for (const entry of (currentEntries || [])) {
      consolidated.set(entry.mode, {
        best_score: entry.best_score,
        weekly_score: entry.weekly_score || 0,
        weekly_updated_at: entry.weekly_updated_at,
        previous_weekly_score: entry.previous_weekly_score || 0,
        previous_weekly_updated_at: entry.previous_weekly_updated_at,
        decorations: entry.decorations,
        existing_id: entry.id,
      });
    }

    // Merge in old username entries (same device, different username)
    for (const entry of (oldUsernameEntries || [])) {
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
      } else {
        consolidated.set(entry.mode, {
          best_score: entry.best_score,
          weekly_score: entry.weekly_score || 0,
          weekly_updated_at: entry.weekly_updated_at,
          previous_weekly_score: entry.previous_weekly_score || 0,
          previous_weekly_updated_at: entry.previous_weekly_updated_at,
          decorations: entry.decorations,
          existing_id: null,
        });
      }
    }

    // Merge in other device entries (same username, different device)
    for (const entry of (otherDeviceEntries || [])) {
      const existing = consolidated.get(entry.mode);
      if (existing) {
        existing.best_score = Math.max(existing.best_score, entry.best_score);
        existing.weekly_score = Math.max(existing.weekly_score, entry.weekly_score || 0);
        if (!existing.weekly_updated_at || (entry.weekly_updated_at && entry.weekly_updated_at > existing.weekly_updated_at)) {
          existing.weekly_updated_at = entry.weekly_updated_at;
        }
        existing.previous_weekly_score = Math.max(existing.previous_weekly_score, entry.previous_weekly_score || 0);
      } else {
        consolidated.set(entry.mode, {
          best_score: entry.best_score,
          weekly_score: entry.weekly_score || 0,
          weekly_updated_at: entry.weekly_updated_at,
          previous_weekly_score: entry.previous_weekly_score || 0,
          previous_weekly_updated_at: entry.previous_weekly_updated_at,
          decorations: entry.decorations,
          existing_id: null,
        });
      }
    }

    // Step 4: Write consolidated entries to current device + current username
    const idsToKeep = new Set<string>();

    for (const [entryMode, data] of consolidated.entries()) {
      const { error: upsertError, data: upsertData } = await supabase
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
          decorations: decorations !== undefined ? (decorations || null) : data.decorations,
        }, {
          onConflict: 'device_id,username,mode'
        })
        .select('id');

      if (upsertError) {
        console.error(`Failed to upsert consolidated entry for mode ${entryMode}:`, upsertError);
      } else if (upsertData && upsertData[0]) {
        idsToKeep.add(upsertData[0].id);
      }
    }

    // Step 5: Delete old entries that were merged (only AFTER successful upserts)
    // Delete old username entries on this device
    for (const entry of (oldUsernameEntries || [])) {
      if (!idsToKeep.has(entry.id)) {
        await supabase.from('scores').delete().eq('id', entry.id);
        console.log(`Deleted old username entry: ${entry.username}/${entry.mode} (id=${entry.id})`);
      }
    }

    // Delete other device entries that were merged
    for (const entry of (otherDeviceEntries || [])) {
      if (!idsToKeep.has(entry.id)) {
        await supabase.from('scores').delete().eq('id', entry.id);
        console.log(`Deleted other-device entry: ${entry.mode} from device ${entry.device_id} (id=${entry.id})`);
      }
    }

    if ((oldUsernameEntries && oldUsernameEntries.length > 0) || (otherDeviceEntries && otherDeviceEntries.length > 0)) {
      console.log(`Consolidation complete: ${consolidated.size} modes, kept ${idsToKeep.size} entries`);
    }

    // ===== Now handle the current score submission =====
    const monday = getMondayOfCurrentWeek();

    // Fetch the (now consolidated) existing score for this mode
    const { data: existingScore } = await supabase
      .from('scores')
      .select('best_score, weekly_score, weekly_updated_at')
      .eq('device_id', device_id)
      .ilike('username', username)
      .eq('mode', mode)
      .limit(1)
      .single();

    let best_score = score;
    let weekly_score = score;

    if (existingScore) {
      best_score = Math.max(score, existingScore.best_score);

      const weeklyUpdatedAt = existingScore.weekly_updated_at ? new Date(existingScore.weekly_updated_at) : null;
      const isCurrentWeek = weeklyUpdatedAt && weeklyUpdatedAt >= monday;

      if (isCurrentWeek) {
        weekly_score = Math.max(score, existingScore.weekly_score || 0);
      } else {
        // New week: archive previous weekly score
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
          console.log(`Archived previous weekly score: ${existingScore.weekly_score}`);
        }
        weekly_score = score;
      }

      // Check if anything actually improved
      const bestImproved = score > existingScore.best_score;
      const weeklyImproved = !isCurrentWeek || score > (existingScore.weekly_score || 0);

      if (!bestImproved && !weeklyImproved) {
        console.log(`No improvement for ${username}: best=${existingScore.best_score}, weekly=${existingScore.weekly_score}, submitted=${score}`);
        
        // Still sync decorations across all entries for this username
        if (decorations !== undefined) {
          await supabase
            .from('scores')
            .update({ decorations: decorations || null })
            .ilike('username', username);
        }

        return new Response(
          JSON.stringify({ success: true, updated: false, reason: 'no_improvement', current_best: existingScore.best_score }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sync decorations across all entries for this username
    if (decorations !== undefined) {
      await supabase
        .from('scores')
        .update({ decorations: decorations || null })
        .ilike('username', username);
    }

    // Upsert the score
    const { data, error } = await supabase
      .from('scores')
      .upsert({
        device_id,
        username,
        best_score,
        weekly_score,
        weekly_updated_at: new Date().toISOString(),
        mode,
        decorations: decorations || null,
        created_at: existingScore ? undefined : new Date().toISOString()
      }, {
        onConflict: 'device_id,username,mode'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Score saved:', { username, mode, best_score, weekly_score });

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
      JSON.stringify({ success: true, updated: true, best_score, weekly_score }),
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
