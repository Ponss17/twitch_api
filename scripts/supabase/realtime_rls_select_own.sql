-- Realtime del panel: con RLS activo SIN políticas SELECT, el JWT
-- `authenticated` no recibe postgres_changes (activity / stats).
-- El backend (service_role) sigue escribiendo bien; solo falla el live feed.
--
-- El JWT del panel usa sub/user_id = Twitch ID (texto), no UUID de GoTrue.
-- Ejecutar en SQL Editor de Supabase (Production).

-- 1) Lectura propia para el canal Realtime
DROP POLICY IF EXISTS activity_logs_select_own ON public.activity_logs;
CREATE POLICY activity_logs_select_own
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = COALESCE(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS user_stats_select_own ON public.user_stats;
CREATE POLICY user_stats_select_own
  ON public.user_stats
  FOR SELECT
  TO authenticated
  USING (
    user_id = COALESCE(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS user_daily_stats_select_own ON public.user_daily_stats;
CREATE POLICY user_daily_stats_select_own
  ON public.user_daily_stats
  FOR SELECT
  TO authenticated
  USING (
    user_id = COALESCE(auth.jwt() ->> 'user_id', auth.jwt() ->> 'sub')
  );

-- 2) Asegurar tablas en la publication de Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_daily_stats;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Comprobar:
-- SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
--   AND tablename IN ('activity_logs','user_stats','user_daily_stats');
-- SELECT polname, tablename FROM pg_policies
--   WHERE tablename IN ('activity_logs','user_stats','user_daily_stats');
