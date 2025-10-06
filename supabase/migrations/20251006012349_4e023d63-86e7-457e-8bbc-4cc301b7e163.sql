-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create cron job to cleanup old scores every Monday at 00:01
SELECT cron.schedule(
  'cleanup-old-scores-weekly',
  '1 0 * * 1', -- Every Monday at 00:01 (minute 1, hour 0, day of month *, month *, day of week 1=Monday)
  $$
  SELECT public.cleanup_old_scores();
  $$
);