-- Vérifier et ajouter les colonnes manquantes à la table profiles si nécessaire
DO $$
BEGIN
    -- Vérifier si les colonnes username et email existent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END
$$;

-- Créer la table des scores/classements
CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Activer Row Level Security pour leaderboard
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour leaderboard
CREATE POLICY "Le classement est visible par tous" 
ON public.leaderboard 
FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leurs scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs scores" 
ON public.leaderboard 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Fonction pour mettre à jour la colonne updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at sur leaderboard
CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();