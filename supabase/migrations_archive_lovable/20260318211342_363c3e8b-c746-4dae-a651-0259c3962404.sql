
ALTER TABLE public.scores
ADD COLUMN IF NOT EXISTS monthly_score integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_updated_at timestamp with time zone DEFAULT NULL;
