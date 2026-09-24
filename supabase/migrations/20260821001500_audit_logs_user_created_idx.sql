-- Índice para el listado por usuario en Ajustes → Seguridad.
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC);
