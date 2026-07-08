-- Cascada al borrar cuenta: defensa en profundidad junto con deletes explícitos en userService.deleteUser.
-- Ejecutar en Supabase prod tras backup. Idempotente donde sea posible.

-- user_daily_stats ya tiene CASCADE en analytics_refactor.sql; reforzar si falta la FK.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_daily_stats_user_id_fkey'
          AND confdeltype = 'c'
    ) THEN
        ALTER TABLE public.user_daily_stats
            DROP CONSTRAINT IF EXISTS user_daily_stats_user_id_fkey;
        ALTER TABLE public.user_daily_stats
            ADD CONSTRAINT user_daily_stats_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'user_daily_stats no existe — omitiendo FK CASCADE';
END;
$$;

-- user_stats
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
        ALTER TABLE public.user_stats
            DROP CONSTRAINT IF EXISTS user_stats_user_id_fkey;
        ALTER TABLE public.user_stats
            ADD CONSTRAINT user_stats_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

-- activity_logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
        ALTER TABLE public.activity_logs
            DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
        ALTER TABLE public.activity_logs
            ADD CONSTRAINT activity_logs_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

-- audit_logs (acciones por user_id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        ALTER TABLE public.audit_logs
            DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
        ALTER TABLE public.audit_logs
            ADD CONSTRAINT audit_logs_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
    END IF;
END;
$$;

-- system_logs es global (sin user_id) — no se incluye en borrado de cuenta.
