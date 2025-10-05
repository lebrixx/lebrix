-- Améliorer la fonction de nettoyage pour garder top 1000 par mode
CREATE OR REPLACE FUNCTION public.cleanup_old_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Pour chaque mode, garder seulement le top 1000 scores
  WITH ranked_scores AS (
    SELECT id,
           mode,
           ROW_NUMBER() OVER (PARTITION BY mode ORDER BY score DESC, created_at DESC) as rank
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

-- Activer les extensions nécessaires pour le cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer un cron job qui s'exécute tous les jours à 3h du matin
SELECT cron.schedule(
  'cleanup-old-scores-daily',
  '0 3 * * *', -- Tous les jours à 3h du matin
  $$SELECT cleanup_old_scores()$$
);