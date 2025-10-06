-- Supprimer l'ancien cron job quotidien
SELECT cron.unschedule('cleanup-old-scores-daily');

-- Créer un nouveau cron job qui s'exécute chaque lundi à 00h01
SELECT cron.schedule(
  'cleanup-old-scores-weekly',
  '1 0 * * 1', -- Chaque lundi à 00h01 (minute heure jour mois jour_semaine)
  $$SELECT cleanup_old_scores()$$
);