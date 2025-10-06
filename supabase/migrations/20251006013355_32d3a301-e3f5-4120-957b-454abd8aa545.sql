-- Modify scores table to separate global and weekly scores
ALTER TABLE public.scores
  RENAME COLUMN score TO best_score;

ALTER TABLE public.scores
  ADD COLUMN weekly_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN weekly_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for weekly queries
CREATE INDEX idx_scores_weekly ON public.scores(mode, weekly_updated_at, weekly_score DESC);

-- Update cleanup function to also reset old weekly scores
CREATE OR REPLACE FUNCTION public.cleanup_old_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Pour chaque mode, garder seulement le top 1000 best_scores
  WITH ranked_scores AS (
    SELECT id,
           mode,
           ROW_NUMBER() OVER (PARTITION BY mode ORDER BY best_score DESC, created_at DESC) as rank
    FROM public.scores
  )
  DELETE FROM public.scores
  WHERE id IN (
    SELECT id 
    FROM ranked_scores 
    WHERE rank > 1000
  );
END;
$function$;