-- Realtime: auth.uid()/sub debe ser UUID. Las políticas solo usan claim user_id (Twitch).
DROP POLICY IF EXISTS activity_logs_select_own ON public.activity_logs;
CREATE POLICY activity_logs_select_own ON public.activity_logs
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'user_id'));

DROP POLICY IF EXISTS user_stats_select_own ON public.user_stats;
CREATE POLICY user_stats_select_own ON public.user_stats
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'user_id'));

DROP POLICY IF EXISTS user_daily_stats_select_own ON public.user_daily_stats;
CREATE POLICY user_daily_stats_select_own ON public.user_daily_stats
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'user_id'));

NOTIFY pgrst, 'reload schema';
