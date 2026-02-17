
-- Add columns to preserve previous week's scores
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS previous_weekly_score integer NOT NULL DEFAULT 0;
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS previous_weekly_updated_at timestamp with time zone;
