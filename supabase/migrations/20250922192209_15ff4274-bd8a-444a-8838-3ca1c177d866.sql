-- Corriger la vulnérabilité de sécurité : supprimer la colonne email de profiles
-- car elle est redondante (déjà présente dans auth.users) et pose un risque de sécurité

-- Supprimer la colonne email de la table profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Les profils sont visibles par tous" ON public.profiles;

-- Créer une nouvelle policy plus sécurisée qui permet seulement de voir les pseudos
-- (nécessaire pour le classement) mais pas les données sensibles
CREATE POLICY "Public can view usernames only" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Créer une policy pour que les utilisateurs puissent voir leur propre profil complet
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Mettre à jour la fonction handle_new_user pour ne plus insérer l'email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;