-- Fix 1: Create a public view that hides device_id for privacy
CREATE VIEW public.scores_public AS
SELECT id, username, mode, score, created_at
FROM public.scores;

-- Grant SELECT access to the view
GRANT SELECT ON public.scores_public TO anon, authenticated;

-- Add comment to explain the view
COMMENT ON VIEW public.scores_public IS 'Public leaderboard view that excludes device_id for privacy protection';

-- Fix 2: Create persistent rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  fingerprint TEXT PRIMARY KEY,
  submission_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_submission TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role full access to rate_limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_fingerprint ON public.rate_limits(fingerprint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Add comment
COMMENT ON TABLE public.rate_limits IS 'Persistent rate limiting to survive edge function restarts';