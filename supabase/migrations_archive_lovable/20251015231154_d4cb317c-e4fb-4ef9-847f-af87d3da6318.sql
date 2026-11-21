-- Supprimer l'ancienne contrainte de mode
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_mode_check;

-- Ajouter la nouvelle contrainte avec le mode mémoire expert
ALTER TABLE public.scores ADD CONSTRAINT scores_mode_check 
CHECK (mode IN ('classic', 'arc_changeant', 'survie_60s', 'zone_mobile', 'zone_traitresse', 'memoire_expert'));