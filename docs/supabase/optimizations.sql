-- Optimizaciones Supabase — LosPerris Twitch API
-- Ejecutar en: Supabase Dashboard → SQL Editor (staging → producción)

-- ---------------------------------------------------------------------------
-- 1. Índices (consultas frecuentes)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_login ON public.users (login);

CREATE INDEX IF NOT EXISTS idx_activity_user_created_asc
    ON public.activity_logs (user_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- 2. Expiración OAuth persistida (evita probe a Twitch en cada cache-miss)
-- ---------------------------------------------------------------------------

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 3. Purge de activity_logs en una sola operación
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trim_activity_logs(p_user_id TEXT, p_max INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.activity_logs
    WHERE id IN (
        SELECT id
        FROM public.activity_logs
        WHERE user_id = p_user_id
        ORDER BY created_at ASC
        OFFSET GREATEST(p_max, 0)
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. record_user_request — fecha local opcional (sin SELECT timezone por comando)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_user_request(
    p_user_id TEXT,
    p_latency INT,
    p_success BOOLEAN,
    p_local_date DATE DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tz    TEXT;
    v_today DATE;
BEGIN
    IF p_local_date IS NOT NULL THEN
        v_today := p_local_date;
    ELSE
        SELECT COALESCE(timezone, 'UTC') INTO v_tz
        FROM public.users
        WHERE user_id = p_user_id;

        v_today := (now() AT TIME ZONE COALESCE(v_tz, 'UTC'))::DATE;
    END IF;

    UPDATE public.user_stats SET
        today_requests = CASE WHEN last_stats_date < v_today THEN 1 ELSE today_requests + 1 END,
        today_errors   = CASE WHEN last_stats_date < v_today THEN (CASE WHEN NOT p_success THEN 1 ELSE 0 END) ELSE today_errors + (CASE WHEN NOT p_success THEN 1 ELSE 0 END) END,
        today_latency  = CASE WHEN last_stats_date < v_today THEN p_latency ELSE today_latency + p_latency END,
        last_stats_date = v_today,
        total_requests = total_requests + 1,
        total_latency  = total_latency + p_latency,
        total_errors   = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
        last_updated   = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.platform_daily_stats (date, total_requests)
    VALUES (v_today, 1)
    ON CONFLICT (date) DO UPDATE
        SET total_requests = public.platform_daily_stats.total_requests + 1;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Seguridad RPC — solo backend (service_role)
--    Corrige linter: anon_security_definer_function_executable (0028/0029)
-- ---------------------------------------------------------------------------

-- Sobrecarga antigua (3 args); la versión con p_local_date es la vigente
DROP FUNCTION IF EXISTS public.record_user_request(TEXT, INT, BOOLEAN);

DO $$
DECLARE
    fn regprocedure;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'increment_user_stat',
              'record_user_request',
              'trim_activity_logs'
          )
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', fn);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END LOOP;
END;
$$;
