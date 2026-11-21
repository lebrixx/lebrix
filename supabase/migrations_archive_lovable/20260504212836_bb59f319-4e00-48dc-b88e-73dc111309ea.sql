-- Révoquer l'exécution publique sur toutes les fonctions SECURITY DEFINER internes
REVOKE EXECUTE ON FUNCTION public.cleanup_old_daily_precision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_leaderboard_secure(text, integer, integer, integer, numeric, integer) FROM PUBLIC, anon, authenticated;