CREATE OR REPLACE FUNCTION public.cleanup_old_daily_precision()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.daily_precision_scores
  WHERE challenge_date < CURRENT_DATE - INTERVAL '3 days';
END;
$$;