-- Ajouter la policy UPDATE pour permettre les upserts depuis l'app iOS
-- (nécessaire pour le health check et les soumissions de scores)

DROP POLICY IF EXISTS "public_update_scores" ON public.scores;
CREATE POLICY "public_update_scores" 
ON public.scores 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Cette policy permet aux apps iOS utilisant la clé anon de faire des UPSERTS
-- La sécurité est assurée par l'edge function en production