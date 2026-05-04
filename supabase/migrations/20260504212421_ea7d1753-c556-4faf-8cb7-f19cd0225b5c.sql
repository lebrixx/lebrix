ALTER TABLE public.scores
DROP CONSTRAINT IF EXISTS scores_mode_check;

ALTER TABLE public.scores
ADD CONSTRAINT scores_mode_check
CHECK (mode = ANY (ARRAY[
  'classic'::text,
  'arc_changeant'::text,
  'survie_60s'::text,
  'zone_mobile'::text,
  'zone_traitresse'::text,
  'memoire_expert'::text,
  'pong_circulaire'::text
]));