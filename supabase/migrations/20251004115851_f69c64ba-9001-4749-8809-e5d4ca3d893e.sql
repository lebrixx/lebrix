-- Fix 1: Add zone_traitresse to the scores mode constraint
ALTER TABLE public.scores 
DROP CONSTRAINT IF EXISTS scores_mode_check;

ALTER TABLE public.scores
ADD CONSTRAINT scores_mode_check 
CHECK (mode = ANY (ARRAY[
  'classic'::text, 
  'arc_changeant'::text, 
  'survie_60s'::text, 
  'zone_mobile'::text,
  'zone_traitresse'::text
]));

-- Fix 2: Remove direct UPDATE policy on leaderboard to prevent score manipulation
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs scores" ON public.leaderboard;

-- Create a secure server-side function for updating leaderboard
CREATE OR REPLACE FUNCTION public.update_leaderboard_secure(
  p_mode TEXT,
  p_score INTEGER,
  p_coins INTEGER,
  p_games_played INTEGER,
  p_max_speed_reached NUMERIC,
  p_direction_changes INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow updates if the new score is better than the existing one
  INSERT INTO public.leaderboard (
    user_id,
    mode,
    score,
    coins,
    games_played,
    max_speed_reached,
    direction_changes,
    created_at,
    updated_at
  ) VALUES (
    auth.uid(),
    p_mode,
    p_score,
    p_coins,
    p_games_played,
    p_max_speed_reached,
    p_direction_changes,
    now(),
    now()
  )
  ON CONFLICT (user_id, mode)
  DO UPDATE SET
    score = GREATEST(leaderboard.score, p_score),
    coins = p_coins,
    games_played = p_games_played,
    max_speed_reached = GREATEST(leaderboard.max_speed_reached, p_max_speed_reached),
    direction_changes = p_direction_changes,
    updated_at = now()
  WHERE leaderboard.user_id = auth.uid() AND leaderboard.mode = p_mode;
END;
$$;