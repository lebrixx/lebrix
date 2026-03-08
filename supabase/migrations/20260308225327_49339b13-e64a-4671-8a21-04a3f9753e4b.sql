CREATE OR REPLACE FUNCTION public.cleanup_old_daily_precision()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.daily_precision_scores
  WHERE challenge_date < CURRENT_DATE - INTERVAL '2 days';
END;
$function$;