-- Refactorización de user_stats (Eliminación de Columnas Legacy)
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 1. Eliminar la lógica vieja de log_user_request que intentaba actualizar estas columnas dinámicamente.
-- Sobrescribimos la función para que NO intente hacer EXECUTE format(...) sobre las columnas legacy.
CREATE OR REPLACE FUNCTION public.log_user_request(
    p_user_id TEXT,
    p_command TEXT,
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

    -- 2A. Insertar en la tabla de serie de tiempo (Daily Stats)
    INSERT INTO public.user_daily_stats (user_id, date, command_name, requests_count, errors_count, latency_sum)
    VALUES (
        p_user_id, 
        v_today, 
        COALESCE(p_command, 'other'), 
        1, 
        CASE WHEN NOT p_success THEN 1 ELSE 0 END, 
        p_latency
    )
    ON CONFLICT (user_id, date, command_name) DO UPDATE
        SET 
            requests_count = public.user_daily_stats.requests_count + 1,
            errors_count = public.user_daily_stats.errors_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
            latency_sum = public.user_daily_stats.latency_sum + p_latency;

    -- 2B. Actualizar solo los totales globales en user_stats (Legacy/Cache)
    UPDATE public.user_stats SET
        today_requests  = CASE WHEN last_stats_date < v_today THEN 1 ELSE today_requests + 1 END,
        today_errors    = CASE WHEN last_stats_date < v_today THEN (CASE WHEN NOT p_success THEN 1 ELSE 0 END) ELSE today_errors + (CASE WHEN NOT p_success THEN 1 ELSE 0 END) END,
        today_latency   = CASE WHEN last_stats_date < v_today THEN p_latency ELSE today_latency + p_latency END,
        last_stats_date = v_today,
        total_requests  = total_requests + 1,
        total_latency   = total_latency + p_latency,
        total_errors    = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
        last_updated    = NOW()
    WHERE user_id = p_user_id;

    -- 2D. Actualizar estadísticas globales de la plataforma
    INSERT INTO public.platform_daily_stats (date, total_requests)
    VALUES (v_today, 1)
    ON CONFLICT (date) DO UPDATE
        SET total_requests = public.platform_daily_stats.total_requests + 1;

END;
$$;

-- 2. Eliminar las columnas de comandos individuales de la tabla user_stats
ALTER TABLE public.user_stats 
DROP COLUMN IF EXISTS clips_count,
DROP COLUMN IF EXISTS followage_count,
DROP COLUMN IF EXISTS so_count,
DROP COLUMN IF EXISTS stalker_count,
DROP COLUMN IF EXISTS trends_count,
DROP COLUMN IF EXISTS roulette_count,
DROP COLUMN IF EXISTS message_count,
DROP COLUMN IF EXISTS russian_count,
DROP COLUMN IF EXISTS magic8_count,
DROP COLUMN IF EXISTS duel_count;
