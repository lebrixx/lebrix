-- Remove XP system completely
-- Drop the player_levels table
DROP TABLE IF EXISTS public.player_levels CASCADE;

-- Drop XP-related functions
DROP FUNCTION IF EXISTS public.add_player_xp(uuid, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_xp_for_level(integer) CASCADE;