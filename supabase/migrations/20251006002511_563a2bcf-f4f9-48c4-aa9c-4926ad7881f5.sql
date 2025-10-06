-- Create player_levels table to track player XP and levels
CREATE TABLE IF NOT EXISTS public.player_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  current_xp BIGINT NOT NULL DEFAULT 0,
  total_xp BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;

-- Users can view their own level
CREATE POLICY "Users can view their own level"
  ON public.player_levels
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own level (auto-created on first game)
CREATE POLICY "Users can insert their own level"
  ON public.player_levels
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own level
CREATE POLICY "Users can update their own level"
  ON public.player_levels
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to calculate XP needed for next level
-- Formula: 100 * (level^1.8) for exponential progression
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level_num INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN FLOOR(100 * POWER(level_num, 1.8))::BIGINT;
END;
$$;

-- Function to add XP and level up
CREATE OR REPLACE FUNCTION public.add_player_xp(p_user_id UUID, xp_gained BIGINT)
RETURNS TABLE(new_level INTEGER, new_current_xp BIGINT, leveled_up BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_level INTEGER;
  v_current_xp BIGINT;
  v_total_xp BIGINT;
  v_xp_needed BIGINT;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get or create player level record
  INSERT INTO public.player_levels (user_id, level, current_xp, total_xp)
  VALUES (p_user_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current stats
  SELECT level, current_xp, total_xp
  INTO v_level, v_current_xp, v_total_xp
  FROM public.player_levels
  WHERE user_id = p_user_id;

  -- Add XP
  v_current_xp := v_current_xp + xp_gained;
  v_total_xp := v_total_xp + xp_gained;

  -- Level up loop (can level up multiple times)
  WHILE v_level < 100 LOOP
    v_xp_needed := calculate_xp_for_level(v_level);
    
    IF v_current_xp >= v_xp_needed THEN
      v_current_xp := v_current_xp - v_xp_needed;
      v_level := v_level + 1;
      v_leveled_up := TRUE;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Cap at level 100
  IF v_level >= 100 THEN
    v_level := 100;
    v_current_xp := 0;
  END IF;

  -- Update player level
  UPDATE public.player_levels
  SET 
    level = v_level,
    current_xp = v_current_xp,
    total_xp = v_total_xp,
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_level, v_current_xp, v_leveled_up;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_player_levels_updated_at
  BEFORE UPDATE ON public.player_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();