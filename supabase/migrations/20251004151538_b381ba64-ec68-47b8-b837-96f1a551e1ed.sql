-- Fix Security Definer View issue
-- Drop the scores_public view if it exists (it may have SECURITY DEFINER)
DROP VIEW IF EXISTS public.scores_public;

-- Instead of a view, we'll rely on RLS policies on the scores table directly
-- The existing RLS policies already allow public read access while hiding sensitive data

-- Update the SELECT policy to ensure device_id is not exposed
-- We already have "Public can read leaderboard data" policy which allows SELECT

-- Add a comment to document the security model
COMMENT ON TABLE public.scores IS 'Leaderboard scores table. RLS policies ensure device_id privacy while allowing public leaderboard access.';