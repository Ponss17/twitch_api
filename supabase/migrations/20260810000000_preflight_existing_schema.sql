-- Estas migraciones actualizan un esquema existente; no adivinar tablas base.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(required.name, ', ' ORDER BY required.name)
    INTO missing
  FROM (VALUES
    ('users'),
    ('user_stats'),
    ('activity_logs'),
    ('platform_daily_stats'),
    ('audit_logs')
  ) AS required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Esquema base incompleto. Faltan tablas: %', missing;
  END IF;
END;
$$;
