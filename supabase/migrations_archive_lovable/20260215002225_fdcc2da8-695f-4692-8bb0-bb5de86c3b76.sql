
-- Remove public insert and update policies that allow bypassing the edge function
DROP POLICY IF EXISTS "public_insert_scores" ON public.scores;
DROP POLICY IF EXISTS "public_update_scores" ON public.scores;
