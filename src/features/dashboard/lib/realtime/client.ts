import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/core/config/config';
import { logError } from '@/core/logging/logError';

/** Un solo cliente Supabase por pestaña (evita GoTrueClient duplicados). */
let sharedSupabaseClient: SupabaseClient | null = null;
let sharedClientInit: Promise<SupabaseClient | null> | null = null;

/** Evita que GoTrue toque localStorage (solo usamos Realtime + JWT propio). */
const noopAuthStorage = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => undefined,
    removeItem: (_key: string) => undefined
};

export async function getSharedSupabaseClient(): Promise<SupabaseClient | null> {
    if (sharedSupabaseClient) return sharedSupabaseClient;
    if (sharedClientInit) return sharedClientInit;

    sharedClientInit = (async () => {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            logError('Realtime', 'Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env');
            return null;
        }
        try {
            const { createClient } = await import('@supabase/supabase-js');
            sharedSupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storage: noopAuthStorage,
                    storageKey: 'losperris-dashboard-realtime'
                },
                realtime: {
                    params: { apikey: SUPABASE_ANON_KEY }
                }
            });
            return sharedSupabaseClient;
        } catch {
            return null;
        } finally {
            sharedClientInit = null;
        }
    })();

    return sharedClientInit;
}
