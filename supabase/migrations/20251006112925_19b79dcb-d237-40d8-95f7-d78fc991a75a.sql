-- Vérifier et corriger les politiques RLS pour permettre l'accès public complet
-- (nécessaire pour les apps iOS qui utilisent la clé anon)

-- S'assurer que RLS est activé
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Drop et recréer les policies pour garantir l'accès public complet

-- Policy pour SELECT (lecture publique)
DROP POLICY IF EXISTS "Public can read leaderboard data" ON public.scores;
DROP POLICY IF EXISTS "public read scores" ON public.scores;
CREATE POLICY "public_read_scores" 
ON public.scores 
FOR SELECT 
USING (true);

-- Policy pour INSERT (via edge function ou direct)
DROP POLICY IF EXISTS "allow_service_role_insert_scores" ON public.scores;
DROP POLICY IF EXISTS "block_anon_insert_scores" ON public.scores;
DROP POLICY IF EXISTS "anyone can insert score" ON public.scores;
CREATE POLICY "public_insert_scores" 
ON public.scores 
FOR INSERT 
WITH CHECK (true);

-- Policy pour UPDATE (nécessaire pour health check et upserts)
DROP POLICY IF EXISTS "anyone update scores" ON public.scores;
CREATE POLICY "public_update_scores" 
ON public.scores 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Note: Ces policies sont permissives car la validation est faite dans l'edge function
-- qui utilise la service_role_key. Les clients utilisent la anon key mais passent
-- par l'edge function pour les insertions en production.