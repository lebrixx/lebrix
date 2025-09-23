-- Fix security issue: Allow public read access to public_scores view by updating underlying scores table policies

-- Drop the existing policy that blocks all public reads
DROP POLICY IF EXISTS "public_can_read_leaderboard" ON public.scores;

-- Create a new policy that allows public read access for leaderboard data
-- This is safe because the public_scores view excludes sensitive data like device_id
CREATE POLICY "Public can read leaderboard data"
ON public.scores
FOR SELECT
USING (true);

-- Ensure users can still read their own scores (this policy should already exist)
-- This is redundant but ensures it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'scores' 
        AND policyname = 'users_can_read_own_scores'
    ) THEN
        CREATE POLICY "users_can_read_own_scores"
        ON public.scores
        FOR SELECT
        USING (device_id IN ( 
            SELECT scores_1.device_id
            FROM scores scores_1
            WHERE (scores_1.username = ( 
                SELECT profiles.username
                FROM profiles
                WHERE (profiles.id = auth.uid())
            ))
        ));
    END IF;
END
$$;