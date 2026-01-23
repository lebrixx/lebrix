-- Supprimer l'ancienne contrainte unique sur (device_id, mode) pour permettre plusieurs pseudos par device/mode
ALTER TABLE public.scores
DROP CONSTRAINT IF EXISTS unique_device_mode;