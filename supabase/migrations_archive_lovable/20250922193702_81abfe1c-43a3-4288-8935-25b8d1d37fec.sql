-- Ajouter le mode 'classic' à la contrainte CHECK existante
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_mode_check;
ALTER TABLE scores ADD CONSTRAINT scores_mode_check CHECK (mode IN ('classic', 'arc_changeant', 'survie_60s', 'zone_mobile'));