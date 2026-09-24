-- Additive: run if monthly_reports / user_notifications already exist.
-- Dedup de notificaciones de reporte mensual (una por usuario/mes).

CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_monthly_report_month_uidx
  ON public.user_notifications (user_id, ((payload->>'yearMonth')))
  WHERE type = 'monthly_report';
