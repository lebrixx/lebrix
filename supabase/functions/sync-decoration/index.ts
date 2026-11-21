import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Décorations qui existent dans le jeu (voir src/utils/seasonPass.ts et src/utils/decorations.ts).
// Format envoyé par l'app : au plus un emblème et une couleur, séparés par une virgule (ex. "star,purple_name").
const EMBLEMS = new Set(['star', 'fire', 'sparkle', 'crown', 'diamond', 'trophy', 'dragon']);
const COLORS = new Set(['purple_name', 'pulse_name', 'gold_pulse_name', 'rainbow_name']);

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,16}$/;
const DEVICE_ID_RE = /^[A-Za-z0-9._:-]{1,100}$/;

/** Renvoie la chaîne normalisée, null pour « aucune décoration », ou undefined si la valeur est invalide. */
function normalizeDecorations(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > 40) return undefined;
  const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) return undefined;
  const emblems = parts.filter((p) => EMBLEMS.has(p));
  const colors = parts.filter((p) => COLORS.has(p));
  if (emblems.length + colors.length !== parts.length || emblems.length > 1 || colors.length > 1) return undefined;
  return [...emblems, ...colors].join(',') || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { device_id, username, decorations } = await req.json();

    if (typeof device_id !== 'string' || typeof username !== 'string') {
      return json({ error: 'Missing required fields' }, 400);
    }
    if (!DEVICE_ID_RE.test(device_id)) {
      return json({ error: 'Invalid device id' }, 400);
    }
    if (!USERNAME_RE.test(username)) {
      return json({ error: 'Invalid username format' }, 400);
    }

    const normalized = normalizeDecorations(decorations);
    if (normalized === undefined) {
      return json({ error: 'Invalid decorations' }, 400);
    }

    // Sécurité : seul un appareil qui a déjà un score sous ce pseudo peut agir.
    const { count, error: ownerError } = await supabase
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .eq('device_id', device_id)
      .ilike('username', username);

    if (ownerError) {
      console.error('Ownership check failed:', ownerError);
      return json({ error: 'Failed to sync decoration' }, 500);
    }
    if (!count) {
      // Aucun score encore envoyé par cet appareil sous ce pseudo : rien à synchroniser.
      return json({ success: true, updated: 0 });
    }

    // Le « propriétaire » du pseudo est l'appareil qui l'a utilisé en premier : lui seul propage la décoration
    // à toutes les lignes du pseudo. Un autre appareil (ex. quelqu'un qui reprend le même pseudo) ne modifie que les siennes.
    const { data: first } = await supabase
      .from('scores')
      .select('device_id')
      .ilike('username', username)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let query = supabase.from('scores').update({ decorations: normalized }).ilike('username', username);
    if (first && first.device_id !== device_id) query = query.eq('device_id', device_id);
    const { error } = await query;

    if (error) {
      console.error('Database error:', error);
      return json({ error: 'Failed to sync decoration' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in sync-decoration function:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
