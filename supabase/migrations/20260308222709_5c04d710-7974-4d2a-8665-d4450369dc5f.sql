
-- Table pour le classement quotidien du mode Précision
CREATE TABLE public.daily_precision_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  username text NOT NULL,
  target numeric(6,3) NOT NULL,
  result numeric(6,3) NOT NULL,
  gap numeric(6,3) NOT NULL,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes par date (classement du jour)
CREATE INDEX idx_daily_precision_date ON public.daily_precision_scores(challenge_date, gap ASC);

-- Unique constraint: un seul essai par device par jour
CREATE UNIQUE INDEX idx_daily_precision_unique ON public.daily_precision_scores(device_id, challenge_date);

-- Enable RLS
ALTER TABLE public.daily_precision_scores ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire le classement
CREATE POLICY "public_read_daily_precision"
ON public.daily_precision_scores
FOR SELECT
USING (true);

-- Insertion via service_role uniquement (anti-triche)
CREATE POLICY "service_role_insert_daily_precision"
ON public.daily_precision_scores
FOR INSERT
WITH CHECK (true);

-- Fonction de nettoyage automatique des scores > 2 jours
CREATE OR REPLACE FUNCTION public.cleanup_old_daily_precision()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.daily_precision_scores
  WHERE challenge_date < CURRENT_DATE - INTERVAL '1 day';
END;
$$;
