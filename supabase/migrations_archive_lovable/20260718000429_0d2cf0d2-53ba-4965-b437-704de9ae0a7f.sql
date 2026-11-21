
CREATE TABLE public.brix_factory_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  total_brix_produced BIGINT NOT NULL DEFAULT 0,
  reactor_level INTEGER NOT NULL DEFAULT 1,
  storage_level INTEGER NOT NULL DEFAULT 1,
  amplifier_level INTEGER NOT NULL DEFAULT 1,
  decorations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.brix_factory_scores TO anon, authenticated;
GRANT ALL ON public.brix_factory_scores TO service_role;

ALTER TABLE public.brix_factory_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view brix factory scores"
ON public.brix_factory_scores
FOR SELECT
USING (true);

CREATE TRIGGER update_brix_factory_scores_updated_at
BEFORE UPDATE ON public.brix_factory_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_brix_factory_scores_total ON public.brix_factory_scores (total_brix_produced DESC);
