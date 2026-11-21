
-- Add decorations column to scores table for season pass pseudo decorations
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS decorations text DEFAULT NULL;
