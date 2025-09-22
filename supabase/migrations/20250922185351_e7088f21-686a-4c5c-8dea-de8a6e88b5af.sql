-- Corriger le schéma pour que profiles.id soit de type UUID comme auth.users.id
-- Supprimer d'abord les contraintes de clé étrangère
ALTER TABLE public.leaderboard DROP CONSTRAINT IF EXISTS leaderboard_user_id_fkey;

-- Supprimer la table profiles actuelle
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Créer la table profiles avec le bon type UUID
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Recréer la table leaderboard avec UUID
DROP TABLE IF EXISTS public.leaderboard CASCADE;

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

-- Activer Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour profiles
CREATE POLICY "Les profils sont visibles par tous" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leur profil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur profil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

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

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();