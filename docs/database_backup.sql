-- ========================================================
-- BACKUP COMPLETO DE BASE DE DATOS - LosPerris API
-- Fecha: 2026-03-31
-- Descripción: Esquema completo, Funciones, Índices y Seguridad
-- ========================================================

-- 1. TABLA PRINCIPAL DE USUARIOS
CREATE TABLE IF NOT EXISTS public.users (
    user_id TEXT PRIMARY KEY, -- ID de Twitch
    login TEXT NOT NULL,
    display_name TEXT NOT NULL,
    access_token TEXT, -- Cifrado en Backend
    refresh_token TEXT, -- Cifrado en Backend
    api_key UUID UNIQUE DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT true,
    blocked_reason TEXT,
    custom_rate_limit INTEGER,
    profile_image_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    last_active TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE ESTADÍSTICAS POR USUARIO
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id TEXT PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    clips_count INTEGER DEFAULT 0,
    followage_count INTEGER DEFAULT 0,
    so_count INTEGER DEFAULT 0,
    stalker_count INTEGER DEFAULT 0,
    trends_count INTEGER DEFAULT 0,
    roulette_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    russian_count INTEGER DEFAULT 0,
    magic8_count INTEGER DEFAULT 0,
    duel_count INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    total_latency BIGINT DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    today_requests INTEGER DEFAULT 0,
    today_errors INTEGER DEFAULT 0,
    today_latency BIGINT DEFAULT 0,
    last_stats_date DATE DEFAULT CURRENT_DATE,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE REGISTROS DE ACTIVIDAD (PARA FEED DE HOME)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(user_id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE AUDITORÍA (SEGURIDAD DE ADMINS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    performed_by TEXT REFERENCES public.users(user_id) ON DELETE SET NULL,
    target_user TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS public.admins (
    user_id TEXT PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABLA DE LOGS DE SISTEMA
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    level TEXT DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- FUNCIONES PERSONALIZADAS
-- ========================================================

-- Incremento atómico de estadísticas (Evita Race Conditions)
CREATE OR REPLACE FUNCTION public.increment_user_stat(p_user_id TEXT, p_column TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE user_stats SET %I = %I + 1, last_updated = now() WHERE user_id = %L', p_column, p_column, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Registro atómico de peticiones (Métricas de Latencia y Errores diarios y totales)
-- El reset diario usa la zona horaria del usuario (columna timezone en users), no UTC.
CREATE OR REPLACE FUNCTION public.record_user_request(
  p_user_id TEXT,
  p_latency INT,
  p_success BOOLEAN
) RETURNS void AS $$
DECLARE
  v_tz    TEXT;
  v_today DATE;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
  FROM users WHERE user_id = p_user_id;

  v_today := (now() AT TIME ZONE v_tz)::DATE;

  UPDATE user_stats SET
    today_requests = CASE WHEN last_stats_date < v_today THEN 1               ELSE today_requests + 1 END,
    today_errors   = CASE WHEN last_stats_date < v_today THEN (CASE WHEN NOT p_success THEN 1 ELSE 0 END) ELSE today_errors + (CASE WHEN NOT p_success THEN 1 ELSE 0 END) END,
    today_latency  = CASE WHEN last_stats_date < v_today THEN p_latency       ELSE today_latency + p_latency END,
    last_stats_date = v_today,
    total_requests = total_requests + 1,
    total_latency  = total_latency + p_latency,
    total_errors   = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    last_updated   = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================================
-- OPTIMIZACIÓN (ÍNDICES)
-- ========================================================

-- Índices compuestos para consultas ultra-rápidas en el Dashboard
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON public.activity_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.audit_logs (performed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users (api_key);

-- ========================================================
-- SEGURIDAD (ROW LEVEL SECURITY)
-- ========================================================

-- Bloquear acceso público/anónimo a todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- NOTA: El servidor de Vercel usa la Service Role Key, 
-- por lo cual saltará el RLS automáticamente sin necesidad de políticas adicionales.
