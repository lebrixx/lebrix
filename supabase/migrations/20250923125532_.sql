-- Fix security issue: Remove public access to device_id in scores table

-- 1. First, drop the existing public read policy that exposes device_id
DROP POLICY IF EXISTS "public_read_scores" ON public.scores;

-- 2. Create a secure view for public leaderboard data (no device_id exposed)
CREATE OR REPLACE VIEW public.public_scores AS
SELECT 
  id,
  username,
  score,
  mode,
  created_at
FROM public.scores;

-- 3. Enable RLS on the view
ALTER VIEW public.public_scores SET (security_barrier = true);
ALTER VIEW public.public_scores SET (security_invoker = true);

-- 4. Create policy for public read access to the view only
CREATE POLICY "public_can_read_leaderboard" 
ON public.scores 
FOR SELECT 
USING (false); -- Block direct table access

-- 5. Grant public access to the view
GRANT SELECT ON public.public_scores TO anon;
GRANT SELECT ON public.public_scores TO authenticated;

-- 6. Create RLS policy for the view itself
-- Note: Views in PostgreSQL inherit RLS from base tables by default
-- We ensure only safe columns are accessible through the view

-- 7. Add policy for service role to still access full scores table (for edge functions)
CREATE POLICY "service_role_full_access_scores"
ON public.scores
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 8. Add policy for authenticated users to see only their own scores with device_id
CREATE POLICY "users_can_read_own_scores"
ON public.scores
FOR SELECT
TO authenticated
USING (device_id IN (
  SELECT device_id FROM public.scores 
  WHERE username = (
    SELECT username FROM public.profiles 
    WHERE id = auth.uid()
  )
));

COMMENT ON VIEW public.public_scores IS 'Secure public view of scores without exposing device_id for privacy protection';
COMMENT ON POLICY "service_role_full_access_scores" ON public.scores IS 'Allow edge functions to access full scores data for anti-cheat validation';
COMMENT ON POLICY "users_can_read_own_scores" ON public.scores IS 'Allow authenticated users to see their own scores with device_id';;
