-- Update XP calculation to be 50x more difficult
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level_num integer)
RETURNS bigint
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN FLOOR(5000 * POWER(level_num, 1.8))::BIGINT;
END;
$function$;