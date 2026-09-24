CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  user_id text NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  date date NOT NULL,
  command_name text NOT NULL,
  requests_count integer NOT NULL DEFAULT 0,
  errors_count integer NOT NULL DEFAULT 0,
  latency_sum integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date, command_name)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date
  ON public.user_daily_stats (user_id, date DESC);

-- Versión final de analytics_refactor.sql + refactor_user_stats.sql:
-- no referencia columnas legacy que la siguiente migración elimina.
CREATE OR REPLACE FUNCTION public.log_user_request(
  p_user_id text,
  p_command text,
  p_latency integer,
  p_success boolean,
  p_local_date date DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz text;
  v_today date;
BEGIN
  IF p_local_date IS NOT NULL THEN
    v_today := p_local_date;
  ELSE
    SELECT COALESCE(timezone, 'UTC') INTO v_tz
      FROM public.users WHERE user_id = p_user_id;
    v_today := (now() AT TIME ZONE COALESCE(v_tz, 'UTC'))::date;
  END IF;

  INSERT INTO public.user_daily_stats
    (user_id, date, command_name, requests_count, errors_count, latency_sum)
  VALUES
    (p_user_id, v_today, COALESCE(p_command, 'other'), 1,
     CASE WHEN NOT p_success THEN 1 ELSE 0 END, p_latency)
  ON CONFLICT (user_id, date, command_name) DO UPDATE SET
    requests_count = public.user_daily_stats.requests_count + 1,
    errors_count = public.user_daily_stats.errors_count +
      CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    latency_sum = public.user_daily_stats.latency_sum + p_latency;

  UPDATE public.user_stats SET
    today_requests = CASE WHEN last_stats_date < v_today THEN 1 ELSE today_requests + 1 END,
    today_errors = CASE
      WHEN last_stats_date < v_today THEN CASE WHEN NOT p_success THEN 1 ELSE 0 END
      ELSE today_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END
    END,
    today_latency = CASE WHEN last_stats_date < v_today THEN p_latency ELSE today_latency + p_latency END,
    last_stats_date = v_today,
    total_requests = total_requests + 1,
    total_latency = total_latency + p_latency,
    total_errors = total_errors + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    last_updated = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.platform_daily_stats (date, total_requests)
  VALUES (v_today, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_requests = public.platform_daily_stats.total_requests + 1;
END;
$$;
