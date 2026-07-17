
CREATE TABLE public.reflex_grid_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  username text NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  decorations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reflex_grid_scores_best ON public.reflex_grid_scores (best_score DESC);
CREATE INDEX idx_reflex_grid_scores_username_lower ON public.reflex_grid_scores (lower(username));

GRANT SELECT ON public.reflex_grid_scores TO anon;
GRANT SELECT ON public.reflex_grid_scores TO authenticated;
GRANT ALL ON public.reflex_grid_scores TO service_role;

ALTER TABLE public.reflex_grid_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reflex grid leaderboard"
ON public.reflex_grid_scores FOR SELECT
USING (true);

CREATE TRIGGER update_reflex_grid_scores_updated_at
BEFORE UPDATE ON public.reflex_grid_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
