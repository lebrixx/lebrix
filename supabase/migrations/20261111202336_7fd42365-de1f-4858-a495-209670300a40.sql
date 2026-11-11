-- Profiles: only the owner can read their own profile (existing own-profile policy remains)
DROP POLICY IF EXISTS "Public can view usernames only" ON public.profiles;

-- Legacy leaderboard: owners read only their own rows
DROP POLICY IF EXISTS "Le classement est visible par tous" ON public.leaderboard;
CREATE POLICY "Users can view their own leaderboard rows" ON public.leaderboard
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- app_config: only the public min_version key is readable
DROP POLICY IF EXISTS "Anyone can read app_config" ON public.app_config;
CREATE POLICY "Public can read min_version" ON public.app_config
  FOR SELECT TO anon, authenticated USING (key = 'min_version');

-- Daily precision: only recent days are publicly readable
DROP POLICY IF EXISTS "public_read_daily_precision" ON public.daily_precision_scores;
CREATE POLICY "Public can read recent daily precision" ON public.daily_precision_scores
  FOR SELECT TO anon, authenticated USING (challenge_date >= CURRENT_DATE - 2);

-- Public leaderboards: rows stay visible, but hide device identifiers via column grants
REVOKE SELECT ON public.scores FROM anon, authenticated;
GRANT SELECT (id, username, mode, best_score, created_at, weekly_score, weekly_updated_at, previous_weekly_score, previous_weekly_updated_at, decorations, monthly_score, monthly_updated_at) ON public.scores TO anon, authenticated;
DROP POLICY IF EXISTS "public_read_scores" ON public.scores;
DROP POLICY IF EXISTS "users_can_read_own_scores" ON public.scores;
CREATE POLICY "Public leaderboard rows with a score" ON public.scores
  FOR SELECT TO anon, authenticated USING (best_score > 0 OR weekly_score > 0 OR monthly_score > 0 OR previous_weekly_score > 0);

REVOKE SELECT ON public.reflex_grid_scores FROM anon, authenticated;
GRANT SELECT (id, username, best_score, decorations, created_at, updated_at) ON public.reflex_grid_scores TO anon, authenticated;
DROP POLICY IF EXISTS "Public can read reflex grid leaderboard" ON public.reflex_grid_scores;
CREATE POLICY "Public reflex grid rows with a score" ON public.reflex_grid_scores
  FOR SELECT TO anon, authenticated USING (best_score > 0);

REVOKE SELECT ON public.brix_factory_scores FROM anon, authenticated;
GRANT SELECT (id, username, total_brix_produced, reactor_level, storage_level, amplifier_level, decorations, factory_earnings, created_at, updated_at) ON public.brix_factory_scores TO anon, authenticated;
DROP POLICY IF EXISTS "Public can view brix factory scores" ON public.brix_factory_scores;
CREATE POLICY "Public brix factory rows with earnings" ON public.brix_factory_scores
  FOR SELECT TO anon, authenticated USING (factory_earnings > 0);

REVOKE SELECT ON public.daily_precision_scores FROM anon, authenticated;
GRANT SELECT (id, username, target, result, gap, challenge_date, decorations, created_at) ON public.daily_precision_scores TO anon, authenticated;