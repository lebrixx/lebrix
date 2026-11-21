-- Fix the function search path security issue
-- The cleanup function needs a secure search_path setting

DROP FUNCTION IF EXISTS public.cleanup_old_scores();

CREATE OR REPLACE FUNCTION public.cleanup_old_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete scores older than 6 months, keeping only top 1000 per mode
  WITH ranked_scores AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY mode ORDER BY score DESC, created_at DESC) as rank
    FROM public.scores
    WHERE created_at > NOW() - INTERVAL '6 months'
  ),
  scores_to_delete AS (
    SELECT s.id
    FROM public.scores s
    LEFT JOIN ranked_scores rs ON s.id = rs.id
    WHERE s.created_at <= NOW() - INTERVAL '6 months'
       OR rs.rank > 1000
       OR rs.id IS NULL
  )
  DELETE FROM public.scores
  WHERE id IN (SELECT id FROM scores_to_delete);
END;
$$;