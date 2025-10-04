import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration constants
const SCORE_LIMITS = {
  classic: 10000,
  arc_changeant: 8000,
  survie_60s: 6000,
  zone_mobile: 7000
};

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const MIN_GAME_DURATION = 5000; // 5 seconds minimum

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, username, score, mode, session_start_time, client_fingerprint } = await req.json();

    console.log('Score submission attempt:', { device_id, username, score, mode });

    // Input validation
    if (!device_id || !username || typeof score !== 'number' || !mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate mode
    const validModes = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile'];
    if (!validModes.includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid game mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score validation
    const maxScore = SCORE_LIMITS[mode as keyof typeof SCORE_LIMITS];
    if (score < 2 || score > maxScore) {
      console.log(`Score validation failed: ${score} (must be >= 2 and <= ${maxScore}) for mode ${mode}`);
      return new Response(
        JSON.stringify({ error: 'Invalid score range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove game duration validation completely - no time restrictions

    // Persistent rate limiting with database-backed storage
    const fingerprint = `${device_id}_${client_fingerprint || 'unknown'}`;
    const now = Date.now();

    // Check rate limit from database
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (!rateLimitError && rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start).getTime();
      const timeSinceWindowStart = now - windowStart;

      if (timeSinceWindowStart < RATE_LIMIT_WINDOW) {
        if (rateLimitData.submission_count >= MAX_SUBMISSIONS_PER_WINDOW) {
          console.log(`Persistent rate limit exceeded for fingerprint: ${fingerprint}`);
          return new Response(
            JSON.stringify({ error: 'Too many submissions, please wait' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Increment count in current window
        await supabase
          .from('rate_limits')
          .update({
            submission_count: rateLimitData.submission_count + 1,
            last_submission: new Date().toISOString()
          })
          .eq('fingerprint', fingerprint);
      } else {
        // Reset window
        await supabase
          .from('rate_limits')
          .update({
            submission_count: 1,
            window_start: new Date().toISOString(),
            last_submission: new Date().toISOString()
          })
          .eq('fingerprint', fingerprint);
      }
    } else {
      // Create new rate limit entry
      await supabase
        .from('rate_limits')
        .insert({
          fingerprint,
          submission_count: 1,
          window_start: new Date().toISOString(),
          last_submission: new Date().toISOString()
        });
    }

    // Check if there's an existing score for this device_id and mode
    const { data: existingScore } = await supabase
      .from('scores')
      .select('score')
      .eq('device_id', device_id)
      .eq('mode', mode)
      .single();

    // Only submit if no existing score or new score is better
    if (existingScore && score <= existingScore.score) {
      console.log(`Score not better than existing: ${score} <= ${existingScore.score}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Score not improved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert the score (insert or update if better)
    const { data, error } = await supabase
      .from('scores')
      .upsert({
        device_id,
        username,
        score,
        mode,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'device_id,mode'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Score successfully submitted:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
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