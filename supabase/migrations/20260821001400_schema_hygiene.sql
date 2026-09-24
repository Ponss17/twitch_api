-- Higiene de esquema live (2026-08-21):
-- FKs CASCADE, índices duplicados, retención de logs, RLS legacy, Realtime users.

-- 1) Huérfanos antes de FKs
DELETE FROM public.streamer_questions q
 WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = q.user_id);

DELETE FROM public.viewer_activity_buckets b
 WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = b.user_id);

-- 2) FKs ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'streamer_questions_user_id_fkey'
  ) THEN
    ALTER TABLE public.streamer_questions
      ADD CONSTRAINT streamer_questions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'viewer_activity_buckets_user_id_fkey'
  ) THEN
    ALTER TABLE public.viewer_activity_buckets
      ADD CONSTRAINT viewer_activity_buckets_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 3) Índices duplicados (se deja 1 útil por patrón de query)
DROP INDEX IF EXISTS public.activity_logs_user_created_idx;
DROP INDEX IF EXISTS public.activity_logs_user_type_created_idx;
DROP INDEX IF EXISTS public.idx_activity_user;
DROP INDEX IF EXISTS public.idx_activity_user_created_asc;
DROP INDEX IF EXISTS public.idx_activity_user_created_desc;

DROP INDEX IF EXISTS public.users_api_key_hash_uidx;
DROP INDEX IF EXISTS public.users_discord_id_uidx;
DROP INDEX IF EXISTS public.users_discord_id_idx;
DROP INDEX IF EXISTS public.idx_users_login;
DROP INDEX IF EXISTS public.idx_users_api_key;

DROP INDEX IF EXISTS public.user_daily_stats_user_date_idx;

-- 4) Retención 90 días + RPC para repetir
DELETE FROM public.system_logs
 WHERE timestamp IS NOT NULL
   AND timestamp < now() - interval '90 days';

DELETE FROM public.audit_logs
 WHERE created_at IS NOT NULL
   AND created_at < now() - interval '90 days';

DELETE FROM public.discord_link_events
 WHERE created_at < now() - interval '90 days';

CREATE OR REPLACE FUNCTION public.prune_operational_logs(p_keep interval DEFAULT interval '90 days')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_logs
   WHERE timestamp IS NOT NULL AND timestamp < now() - p_keep;
  DELETE FROM public.audit_logs
   WHERE created_at IS NOT NULL AND created_at < now() - p_keep;
  DELETE FROM public.discord_link_events
   WHERE created_at < now() - p_keep;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_operational_logs(interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_operational_logs(interval) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_operational_logs(interval) TO service_role;

-- 5) Políticas RLS legacy (auth.uid() vs user_id Twitch, o SELECT global)
DROP POLICY IF EXISTS "Allow users to insert own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow users to read own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow users to read own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Allow users to update own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Allow authenticated to read daily stats" ON public.platform_daily_stats;

-- 6) users no debe ir en Realtime (contiene tokens)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.users;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN undefined_table THEN NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
