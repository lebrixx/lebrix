-- Remove public insert access from scores table and add server-side validation
-- This prevents direct client access and forces all submissions through the Edge Function

-- Drop existing public insert policy
DROP POLICY IF EXISTS "public_insert_scores" ON public.scores;

-- Create a new restrictive policy that only allows inserts from service role
-- (which is what the Edge Function uses)
CREATE POLICY "service_role_insert_scores" ON public.scores
FOR INSERT
WITH CHECK (false); -- This will block all direct inserts from clients

-- Keep read access for leaderboards but limit data exposure
-- Update the read policy to exclude device_id from public view
-- Note: We'll handle this in the application layer by being selective about what we fetch

-- Add an index for better performance on leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON public.scores(mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_device_created ON public.scores(device_id, created_at);

-- Add a function to clean up old scores (data retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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