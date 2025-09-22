-- Fix the broken score insertion policy
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "service_role_insert_scores" ON public.scores;

-- Create a proper policy that allows service role insertions (from Edge Functions)
-- but blocks direct client insertions
CREATE POLICY "allow_service_role_insert_scores" 
ON public.scores 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Ensure anon role cannot insert directly (security)
CREATE POLICY "block_anon_insert_scores" 
ON public.scores 
FOR INSERT 
TO anon
WITH CHECK (false);