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

-- Sin políticas para anon/authenticated: acceso denegado por defecto.
-- service_role bypassa RLS (uso actual del backend).
