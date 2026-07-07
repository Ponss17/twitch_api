-- Refactorización a Modelo de Serie de Tiempo (Time-Series) para Estadísticas
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 1. Crear tabla de estadísticas diarias
CREATE TABLE IF NOT EXISTS public.user_daily_stats (
    user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    command_name TEXT NOT NULL,
    requests_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    latency_sum INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, date, command_name)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON public.user_daily_stats (user_id, date DESC);

-- 2. Nueva función unificada que reemplaza a increment_user_stat y record_user_request
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
    v_legacy_column TEXT;
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

    -- 2B. Actualizar los totales globales en user_stats (Legacy/Cache)
    UPDATE public.user_stats SET
        today_requests  = CASE WHEN last_stats_date < v_today THEN 1 ELSE today_requests + 1 END,
        today_errors    = CASE WHEN last_stats_date < v_today THEN (CASE WHEN NOT p_success THEN 1 ELSE 0 END) ELSE today_errors + (CASE WHEN NOT p_success THEN 1 ELSE 0 END) END,
        today_latency   = CASE WHEN last_stats_date < v_today THEN p_latency ELSE today_latency + p_latency END,
        
        -- Reset diario de los legacy counters si cambió de día
        clips_count     = CASE WHEN last_stats_date < v_today THEN 0 ELSE clips_count END,
        followage_count = CASE WHEN last_stats_date < v_today THEN 0 ELSE followage_count END,
        so_count        = CASE WHEN last_stats_date < v_today THEN 0 ELSE so_count END,
        stalker_count   = CASE WHEN last_stats_date < v_today THEN 0 ELSE stalker_count END,
        trends_count    = CASE WHEN last_stats_date < v_today THEN 0 ELSE trends_count END,
        roulette_count  = CASE WHEN last_stats_date < v_today THEN 0 ELSE roulette_count END,
        message_count   = CASE WHEN last_stats_date < v_today THEN 0 ELSE message_count END,
        russian_count   = CASE WHEN last_stats_date < v_today THEN 0 ELSE russian_count END,
        magic8_count    = CASE WHEN last_stats_date < v_today THEN 0 ELSE magic8_count END,
        duel_count      = CASE WHEN last_stats_date < v_today THEN 0 ELSE duel_count END,
        
        last_stats_date = v_today,
        total_requests  = total_requests + 1,
        total_latency   = total_latency + p_latency,
        total_errors    = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
        last_updated    = NOW()
    WHERE user_id = p_user_id;

    -- 2C. Si fue éxito y tiene comando legacy, actualizar su contador legacy
    IF p_success AND p_command IN (
        'clips', 'followage', 'so', 'stalker',
        'trends', 'roulette', 'message',
        'russian', 'magic8', 'duel'
    ) THEN
        v_legacy_column := p_command || '_count';
        EXECUTE format(
            'UPDATE public.user_stats SET %I = %I + 1 WHERE user_id = $1',
            v_legacy_column
        ) USING p_user_id;
    END IF;

    -- 2D. Actualizar estadísticas globales de la plataforma
    INSERT INTO public.platform_daily_stats (date, total_requests)
    VALUES (v_today, 1)
    ON CONFLICT (date) DO UPDATE
        SET total_requests = public.platform_daily_stats.total_requests + 1;

END;
$$;
