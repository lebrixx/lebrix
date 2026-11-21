-- Ajouter les colonnes manquantes à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Créer la table des scores/classements avec le bon type d'ID
CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  max_speed_reached numeric NOT NULL DEFAULT 0,
  direction_changes integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mode)
);

-- Activer Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour profiles
DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;
CREATE POLICY "Les profils sont visibles par tous" 
ON public.profiles 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent créer leur profil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier leur profil" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- Créer les politiques RLS pour leaderboard
CREATE POLICY "Le classement est visible par tous" 
ON public.leaderboard 
FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leurs scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent modifier leurs scores" 
ON public.leaderboard 
FOR UPDATE 
USING (true);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();