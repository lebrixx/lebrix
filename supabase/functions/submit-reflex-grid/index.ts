import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_SCORE = 5000;
const RATE_LIMIT_WINDOW = 15000;
const MAX_SUBMISSIONS_PER_WINDOW = 30;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, username, score, decorations } = await req.json();

    if (!device_id || !username || typeof score !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[a-zA-Z0-9._-]{3,16}$/.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const safeScore = Math.floor(score);
    if (safeScore < 1 || safeScore > MAX_SCORE) {
      return new Response(
        JSON.stringify({ error: 'Invalid score' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit per device
    const now = Date.now();
    const rl = rateLimitMap.get(device_id);
    if (rl && now < rl.resetTime) {
      if (rl.count >= MAX_SUBMISSIONS_PER_WINDOW) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      rl.count += 1;
    } else {
      rateLimitMap.set(device_id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Upsert best score for this device
    const { data: existing } = await supabase
      .from('reflex_grid_scores')
      .select('best_score')
      .eq('device_id', device_id)
      .maybeSingle();

    if (existing && existing.best_score >= safeScore) {
      // Still update username/decorations for freshness
      await supabase
        .from('reflex_grid_scores')
        .update({ username, decorations: decorations || null })
        .eq('device_id', device_id);
      return new Response(
        JSON.stringify({ success: true, improved: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('reflex_grid_scores')
      .upsert({
        device_id,
        username,
        best_score: safeScore,
        decorations: decorations || null,
      }, { onConflict: 'device_id' });

    if (error) {
      console.error('DB error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, improved: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
