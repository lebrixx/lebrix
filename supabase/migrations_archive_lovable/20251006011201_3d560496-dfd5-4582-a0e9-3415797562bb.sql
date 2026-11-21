-- Revert level changes
-- Remove level column from scores table
ALTER TABLE public.scores DROP COLUMN IF EXISTS level;

-- Revert XP calculation to original formula (100 * level^1.5)
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level_num integer)
RETURNS bigint
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN FLOOR(100 * POWER(level_num, 1.5))::BIGINT;
END;
$function$;