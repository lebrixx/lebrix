
SELECT cron.schedule(
  'cleanup-old-rate-limits-daily',
  '0 3 * * *',
  $$SELECT public.cleanup_old_rate_limits();$$
);
