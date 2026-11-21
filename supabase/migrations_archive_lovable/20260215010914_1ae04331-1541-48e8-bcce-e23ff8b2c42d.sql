-- Révoquer l'accès public à cleanup_old_scores (seul postgres/service_role peut l'appeler)
REVOKE ALL ON FUNCTION public.cleanup_old_scores() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_scores() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_scores() FROM authenticated;

-- Explicit deny policies pour rate_limits (anon + authenticated)
CREATE POLICY deny_anon_all_rate_limits ON public.rate_limits
FOR ALL TO anon
USING (false) WITH CHECK (false);

CREATE POLICY deny_auth_all_rate_limits ON public.rate_limits
FOR ALL TO authenticated
USING (false) WITH CHECK (false);