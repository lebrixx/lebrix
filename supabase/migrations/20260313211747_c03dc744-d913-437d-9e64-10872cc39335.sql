CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_config"
ON public.app_config
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.app_config (key, value) VALUES ('min_version', '1.0.0');