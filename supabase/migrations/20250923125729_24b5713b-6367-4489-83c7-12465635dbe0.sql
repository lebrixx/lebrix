-- Fix security issue: Enable RLS on public_scores table and create appropriate policies

-- Enable Row Level Security on public_scores table
ALTER TABLE public.public_scores ENABLE ROW LEVEL SECURITY;

-- Allow public read access for leaderboards (this is safe since sensitive data like device_id is excluded)
CREATE POLICY "Public can read leaderboard scores"
ON public.public_scores
FOR SELECT
USING (true);

-- Block all public write access to prevent score manipulation
CREATE POLICY "Block public write access to scores"
ON public.public_scores
FOR INSERT
WITH CHECK (false);

-- Allow service role full access for internal operations
CREATE POLICY "Service role can manage public scores"
ON public.public_scores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);