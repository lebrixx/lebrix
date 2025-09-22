-- Add unique constraint on device_id and mode to prevent duplicate entries per user per mode
-- First remove any duplicates keeping the highest score for each device_id/mode combination
WITH ranked_scores AS (
  SELECT id, device_id, mode, score,
         ROW_NUMBER() OVER (PARTITION BY device_id, mode ORDER BY score DESC, created_at DESC) as rn
  FROM public.scores
),
duplicates_to_delete AS (
  SELECT id
  FROM ranked_scores
  WHERE rn > 1
)
DELETE FROM public.scores
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.scores 
ADD CONSTRAINT unique_device_mode UNIQUE (device_id, mode);