-- Drop the existing unique constraint on device_id,mode
ALTER TABLE public.scores DROP CONSTRAINT IF EXISTS scores_device_id_mode_key;

-- Create a new unique constraint on device_id,username,mode
ALTER TABLE public.scores ADD CONSTRAINT scores_device_id_username_mode_key UNIQUE (device_id, username, mode);