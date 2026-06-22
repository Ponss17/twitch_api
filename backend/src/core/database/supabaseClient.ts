import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/env';

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        '❌ Faltan credenciales de Supabase (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)'
    );
}

/**
 * Cliente de Supabase para uso exclusivo en el servidor (Backend).
 * Se utiliza la SERVICE_ROLE_KEY para tener permisos administrativos completos
 * sobre la base de datos (bypass RLS), necesario para gestionar tokens y logs.
 */
export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
