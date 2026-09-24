-- Políticas copiadas de rls_policies.sql/realtime_rls_select_own.sql.
-- No se añaden políticas para tablas distintas de las ya documentadas.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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
END;
$$;
