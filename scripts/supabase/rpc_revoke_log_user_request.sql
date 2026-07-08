-- Revoca ejecución pública de log_user_request (complemento de optimizations.sql).
-- Ejecutar en SQL Editor de Supabase (Production) UNA vez si el REVOKE
-- de optimizations.sql no cubrió esta función.
--
-- Comprobar después:
--   SELECT p.proname, has_function_privilege('anon', p.oid, 'execute') AS anon_exec
--   FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'log_user_request';
-- Esperado: anon_exec = false.

DO $$
DECLARE
    fn regprocedure;
BEGIN
    FOR fn IN
        SELECT p.oid::regprocedure
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'log_user_request'
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
        EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated', fn);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END LOOP;
END;
$$;
