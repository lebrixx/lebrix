-- Fix 1: Change rate_limits policy from public to service_role
DROP POLICY IF EXISTS "Service role full access to rate_limits" ON public.rate_limits;
CREATE POLICY "Service role full access to rate_limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: Set search_path on cleanup_old_daily_precision
CREATE OR REPLACE FUNCTION public.cleanup_old_daily_precision()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.daily_precision_scores
  WHERE challenge_date < CURRENT_DATE - INTERVAL '3 days';
END;
$function$;