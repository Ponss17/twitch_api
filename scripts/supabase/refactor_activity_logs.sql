-- Refactorización de activity_logs
-- 1. Añadimos la columna metadata (JSONB)
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Migramos los datos de "detail" hacia "metadata" y rellenamos user_name nulos
UPDATE public.activity_logs
SET 
  -- Limpiar el usuario anónimo si es nulo
  user_name = COALESCE(user_name, 'Anónimo'),
  
  -- Migrar el detalle según el tipo de actividad
  metadata = CASE 
    WHEN detail IS NULL THEN '{}'::jsonb
    
    -- Ignoramos las variables de bot crudas que se guardaron por error
    WHEN detail LIKE '%$(query)%' OR detail LIKE '%${query}%' THEN '{}'::jsonb
    
    WHEN activity_type = 'followage' THEN jsonb_build_object('target', detail)
    WHEN activity_type = 'shoutout' THEN jsonb_build_object('target', detail)
    
    WHEN activity_type = 'clip' THEN 
      -- A veces detail es "titulo - url", intentamos guardarlo crudo si es complejo
      jsonb_build_object('title', detail)
      
    WHEN activity_type = 'magic8' THEN jsonb_build_object('question', detail)
    WHEN activity_type = 'russian' THEN jsonb_build_object('target', detail)
    WHEN activity_type = 'duel' THEN jsonb_build_object('target', detail)
    
    ELSE jsonb_build_object('raw_detail', detail)
  END
WHERE detail IS NOT NULL OR user_name IS NULL;

-- 3. Eliminamos la columna detail (OPCIONAL: puedes comentarlo si prefieres dejarlo por seguridad unos días)
ALTER TABLE public.activity_logs DROP COLUMN IF EXISTS detail;

-- 4. Hacemos que user_name no pueda ser nulo en el futuro
ALTER TABLE public.activity_logs ALTER COLUMN user_name SET NOT NULL;
