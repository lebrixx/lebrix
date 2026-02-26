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

    // ===== USERNAME OWNERSHIP: migrate old device_ids to current device =====
    // When a player reinstalls or clears cache, their device_id changes.
    // Instead of blocking, we migrate their old scores to the new device_id.
    const { data: oldDeviceEntries } = await supabase
      .from('scores')
      .select('id, device_id, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, decorations')
      .ilike('username', username)
      .neq('device_id', device_id);

    if (oldDeviceEntries && oldDeviceEntries.length > 0) {
      console.log(`Migrating ${oldDeviceEntries.length} entries from old device(s) to ${device_id} for username "${username}"`);
      
      for (const oldEntry of oldDeviceEntries) {
        // Check if current device already has an entry for this mode
        const { data: currentDeviceEntry } = await supabase
          .from('scores')
          .select('id, best_score, weekly_score')
          .eq('device_id', device_id)
          .ilike('username', username)
          .eq('mode', oldEntry.mode)
          .maybeSingle();

        if (currentDeviceEntry) {
          // Merge: keep best scores, delete old entry
          const mergedBest = Math.max(currentDeviceEntry.best_score, oldEntry.best_score);
          const mergedWeekly = Math.max(currentDeviceEntry.weekly_score || 0, oldEntry.weekly_score || 0);
          await supabase
            .from('scores')
            .update({ best_score: mergedBest, weekly_score: mergedWeekly })
            .eq('id', currentDeviceEntry.id);
          await supabase
            .from('scores')
            .delete()
            .eq('id', oldEntry.id);
          console.log(`Merged mode ${oldEntry.mode}: best=${mergedBest}`);
        } else {
          // Transfer: update device_id to current device
          await supabase
            .from('scores')
            .update({ device_id })
            .eq('id', oldEntry.id);
          console.log(`Transferred mode ${oldEntry.mode} to new device`);
        }
      }
    }

    // ===== MIGRATE OLD USERNAMES: if this device had scores under a different username, migrate them =====
    const { data: oldEntries } = await supabase
      .from('scores')
      .select('id, username, mode, best_score, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at')
      .eq('device_id', device_id)
      .neq('username', username);

    if (oldEntries && oldEntries.length > 0) {
      const oldUsername = oldEntries[0].username;
      console.log(`Migrating ${oldEntries.length} scores from "${oldUsername}" to "${username}" for device ${device_id}`);

      for (const oldEntry of oldEntries) {
        // Check if there's already an entry for the new username + same mode
        const { data: existingNew } = await supabase
          .from('scores')
          .select('id, best_score, weekly_score')
          .eq('device_id', device_id)
          .eq('username', username)
          .eq('mode', oldEntry.mode)
          .maybeSingle();

        if (existingNew) {
          // Merge: keep the best scores, then delete the old entry
          const mergedBest = Math.max(existingNew.best_score, oldEntry.best_score);
          const mergedWeekly = Math.max(existingNew.weekly_score || 0, oldEntry.weekly_score || 0);
          await supabase
            .from('scores')
            .update({ best_score: mergedBest, weekly_score: mergedWeekly })
            .eq('id', existingNew.id);
          await supabase
            .from('scores')
            .delete()
            .eq('id', oldEntry.id);
        } else {
          // Simply rename
          await supabase
            .from('scores')
            .update({ username })
            .eq('id', oldEntry.id);
        }
      }
    }

    // ===== FETCH EXISTING SCORE for this device+username+mode =====
    const { data: existingScore } = await supabase
      .from('scores')
      .select('best_score, weekly_score, weekly_updated_at')
      .eq('device_id', device_id)
      .eq('username', username)
      .eq('mode', mode)
      .maybeSingle();

    // Determine best_score and weekly_score
    let best_score = score;
    let weekly_score = score;

    const monday = getMondayOfCurrentWeek();

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
            .eq('username', username)
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
        
        // Still sync decorations
        if (decorations !== undefined) {
          await supabase
            .from('scores')
            .update({ decorations: decorations || null })
            .eq('username', username);
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
        .eq('username', username);
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
