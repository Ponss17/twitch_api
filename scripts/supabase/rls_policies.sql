-- RLS defensa en profundidad (opcional — el backend usa service_role).
-- Ejecutar en SQL Editor de Supabase (Production) UNA vez.
--
-- Comprobar después:
--   SELECT relname, relrowsecurity
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public'
--     AND relname IN ('users','user_stats','user_daily_stats','activity_logs','audit_logs');
-- Esperado: relrowsecurity = true en las 5 tablas.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- service_role bypassa RLS (backend).
-- authenticated necesita SELECT propio para Supabase Realtime (postgres_changes).
-- JWT del panel: sub/user_id = Twitch ID (texto). Ver también realtime_rls_select_own.sql.

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
