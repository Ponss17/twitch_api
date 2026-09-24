ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'user_name'
  ) THEN
    RAISE EXCEPTION 'activity_logs.user_name no existe; no se puede aplicar el refactor conocido';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_logs' AND column_name = 'detail'
  ) THEN
    UPDATE public.activity_logs SET
      user_name = COALESCE(user_name, 'Anónimo'),
      metadata = CASE
        WHEN detail IS NULL THEN '{}'::jsonb
        WHEN detail LIKE '%$(query)%' OR detail LIKE '%${query}%' THEN '{}'::jsonb
        WHEN activity_type IN ('followage', 'shoutout', 'russian', 'duel')
          THEN jsonb_build_object('target', detail)
        WHEN activity_type = 'clip' THEN jsonb_build_object('title', detail)
        WHEN activity_type = 'magic8' THEN jsonb_build_object('question', detail)
        ELSE jsonb_build_object('raw_detail', detail)
      END
    WHERE detail IS NOT NULL OR user_name IS NULL;
  ELSE
    UPDATE public.activity_logs SET user_name = 'Anónimo' WHERE user_name IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.activity_logs DROP COLUMN IF EXISTS detail;
ALTER TABLE public.activity_logs ALTER COLUMN user_name SET NOT NULL;
