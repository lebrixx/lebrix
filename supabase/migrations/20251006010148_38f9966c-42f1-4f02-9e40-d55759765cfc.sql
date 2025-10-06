-- Add level column to scores table
ALTER TABLE public.scores 
ADD COLUMN level INTEGER NOT NULL DEFAULT 1;

-- Create index for better performance when querying by level
CREATE INDEX idx_scores_level ON public.scores(level);