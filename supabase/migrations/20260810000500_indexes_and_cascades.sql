CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type_created
  ON public.activity_logs (user_id, activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
  ON public.activity_logs (user_id, created_at DESC);

DO $$
DECLARE
  item text;
BEGIN
  FOREACH item IN ARRAY ARRAY['user_daily_stats', 'user_stats', 'activity_logs', 'audit_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', item, item || '_user_id_fkey');
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE',
      item,
      item || '_user_id_fkey'
    );
  END LOOP;
END;
$$;
