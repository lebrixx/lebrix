import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TOTAL = 1_000_000_000_000; // 1e12 safety cap
const RATE_LIMIT_WINDOW = 15000;
const MAX_SUBMISSIONS_PER_WINDOW = 20;
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

    const body = await req.json();
    const {
      device_id,
      username,
      total_brix_produced,
      reactor_level,
      storage_level,
      amplifier_level,
      decorations,
    } = body ?? {};

    if (!device_id || !username || typeof total_brix_produced !== 'number') {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^[a-zA-Z0-9._-]{3,16}$/.test(username)) {
      return new Response(JSON.stringify({ error: 'Invalid username' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeTotal = Math.max(0, Math.floor(total_brix_produced));
    if (safeTotal > MAX_TOTAL) {
      return new Response(JSON.stringify({ error: 'Invalid score' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clampLvl = (v: unknown) => {
      const n = typeof v === 'number' ? Math.floor(v) : 1;
      return Math.min(999, Math.max(1, n));
    };
    const rLvl = clampLvl(reactor_level);
    const sLvl = clampLvl(storage_level);
    const aLvl = clampLvl(amplifier_level);

    const now = Date.now();
    const rl = rateLimitMap.get(device_id);
    if (rl && now < rl.resetTime) {
      if (rl.count >= MAX_SUBMISSIONS_PER_WINDOW) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      rl.count += 1;
    } else {
      rateLimitMap.set(device_id, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    const { data: existing } = await supabase
      .from('brix_factory_scores')
      .select('total_brix_produced')
      .eq('device_id', device_id)
      .maybeSingle();

    const nextTotal =
      existing && existing.total_brix_produced > safeTotal
        ? existing.total_brix_produced
        : safeTotal;

    const { error } = await supabase
      .from('brix_factory_scores')
      .upsert(
        {
          device_id,
          username,
          total_brix_produced: nextTotal,
          reactor_level: rLvl,
          storage_level: sLvl,
          amplifier_level: aLvl,
          decorations: decorations || '',
        },
        { onConflict: 'device_id' }
      );

    if (error) {
      console.error('DB error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save score' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, total: nextTotal }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
