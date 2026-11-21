
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_submission < NOW() - INTERVAL '7 days';
END;
$$;
