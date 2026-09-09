-- Apply in Supabase SQL Editor (also mirror under supabase/migrations locally).
-- Monthly report snapshots + server-backed panel notifications (owner-only).

CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  year_month text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_reports_year_month_chk CHECK (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT monthly_reports_user_month_uidx UNIQUE (user_id, year_month)
);

CREATE INDEX IF NOT EXISTS monthly_reports_user_created_idx
  ON public.monthly_reports (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_notifications_type_chk CHECK (char_length(type) BETWEEN 1 AND 64)
);

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications (user_id)
  WHERE read_at IS NULL;

-- Una notificación de reporte por usuario/mes (evita duplicados en carreras de ensure).
CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_monthly_report_month_uidx
  ON public.user_notifications (user_id, ((payload->>'yearMonth')))
  WHERE type = 'monthly_report';

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_reports_select_own ON public.monthly_reports;
CREATE POLICY monthly_reports_select_own
  ON public.monthly_reports
  FOR SELECT
  USING ((auth.jwt() ->> 'user_id') = user_id);

DROP POLICY IF EXISTS user_notifications_select_own ON public.user_notifications;
CREATE POLICY user_notifications_select_own
  ON public.user_notifications
  FOR SELECT
  USING ((auth.jwt() ->> 'user_id') = user_id);

DROP POLICY IF EXISTS user_notifications_update_own ON public.user_notifications;
CREATE POLICY user_notifications_update_own
  ON public.user_notifications
  FOR UPDATE
  USING ((auth.jwt() ->> 'user_id') = user_id)
  WITH CHECK ((auth.jwt() ->> 'user_id') = user_id);

-- Inserts for both tables are performed by the service-role API only.
