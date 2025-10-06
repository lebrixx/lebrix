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
  zone_mobile: 7000,
  zone_traitresse: 8000
};

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const MIN_GAME_DURATION = 5000; // 5 seconds minimum

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

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
    const validModes = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse'];
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

    // Enhanced rate limiting with device fingerprint
    const fingerprint = `${device_id}_${client_fingerprint || 'unknown'}`;
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(fingerprint);

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= MAX_SUBMISSIONS_PER_WINDOW) {
          console.log(`Rate limit exceeded for fingerprint: ${fingerprint}`);
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
      rateLimitMap.set(fingerprint, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      });
    }

    // Check for recent submissions from this device
    const { data: recentScores } = await supabase
      .from('scores')
      .select('created_at')
      .eq('device_id', device_id)
      .gte('created_at', new Date(now - RATE_LIMIT_WINDOW).toISOString())
      .order('created_at', { ascending: false });

    if (recentScores && recentScores.length >= MAX_SUBMISSIONS_PER_WINDOW) {
      console.log(`Database rate limit exceeded for device: ${device_id}`);
      return new Response(
        JSON.stringify({ error: 'Too many recent submissions' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's an existing score for this device_id and mode
    const { data: existingScore } = await supabase
      .from('scores')
      .select('best_score, weekly_score')
      .eq('device_id', device_id)
      .eq('mode', mode)
      .single();

    // Determine best_score and weekly_score
    let best_score = score;
    let should_update = true;

    if (existingScore) {
      // Keep the best score for global leaderboard
      best_score = Math.max(score, existingScore.best_score);
      
      // Don't update if weekly score hasn't improved
      if (score <= existingScore.weekly_score) {
        console.log(`Weekly score not improved: ${score} <= ${existingScore.weekly_score}`);
        should_update = false;
      }
    }

    if (!should_update) {
      return new Response(
        JSON.stringify({ success: false, error: 'Score not improved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert the score with separate best_score and weekly_score
    const { data, error } = await supabase
      .from('scores')
      .upsert({
        device_id,
        username,
        best_score,
        weekly_score: score,
        weekly_updated_at: new Date().toISOString(),
        mode,
        created_at: existingScore ? undefined : new Date().toISOString()
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