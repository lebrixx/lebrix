-- Remove the unused public_scores view to eliminate security risk
-- This view was exposing data from the scores table without clear access control
DROP VIEW IF EXISTS public_scores;