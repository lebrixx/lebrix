import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, username, target, result, gap } = await req.json();

    // Validation
    if (!device_id || !username || typeof target !== 'number' || typeof result !== 'number' || typeof gap !== 'number') {
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

    // Validate gap matches target/result
    const expectedGap = Math.abs(result - target);
    if (Math.abs(expectedGap - gap) > 0.002) {
      return new Response(
        JSON.stringify({ error: 'Invalid gap calculation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate target is in valid range (7-13)
    if (target < 7 || target > 13) {
      return new Response(
        JSON.stringify({ error: 'Invalid target' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate result is in valid range (0-15)
    if (result < 0 || result > 15) {
      return new Response(
        JSON.stringify({ error: 'Invalid result' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cleanup old scores first
    await supabase.rpc('cleanup_old_daily_precision');

    // Upsert score (one per device per day)
    const { error } = await supabase
      .from('daily_precision_scores')
      .upsert({
        device_id,
        username,
        target: Math.round(target * 1000) / 1000,
        result: Math.round(result * 1000) / 1000,
        gap: Math.round(gap * 1000) / 1000,
        challenge_date: new Date().toISOString().slice(0, 10),
      }, { onConflict: 'device_id,challenge_date' });

    if (error) {
      console.error('DB error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
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
