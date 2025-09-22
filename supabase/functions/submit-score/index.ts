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
    const validModes = ['classic', 'arc_changeant', 'survie_60s', 'zone_mobile'];
    if (!validModes.includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid game mode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Score validation
    const maxScore = SCORE_LIMITS[mode as keyof typeof SCORE_LIMITS];
    if (score < 0 || score > maxScore) {
      console.log(`Score validation failed: ${score} exceeds limit ${maxScore} for mode ${mode}`);
      return new Response(
        JSON.stringify({ error: 'Invalid score range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Game duration validation (if provided)
    if (session_start_time) {
      const gameDuration = Date.now() - session_start_time;
      if (gameDuration < MIN_GAME_DURATION) {
        console.log(`Game duration too short: ${gameDuration}ms`);
        return new Response(
          JSON.stringify({ error: 'Game session too short' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Basic score-to-time ratio validation (rough estimate)
      const expectedMinTime = score * 100; // 100ms per point minimum
      if (gameDuration < expectedMinTime) {
        console.log(`Score vs time validation failed: ${score} in ${gameDuration}ms`);
        return new Response(
          JSON.stringify({ error: 'Score progression suspicious' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Insert the validated score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        device_id,
        username,
        score,
        mode,
        created_at: new Date().toISOString()
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