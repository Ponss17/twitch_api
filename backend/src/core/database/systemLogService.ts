import { supabase } from './supabaseClient';

export async function addSystemLog(
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, unknown>
): Promise<void> {
    if (process.env.SUPABASE_URL?.includes('example.supabase.co')) return;

    const { error } = await supabase.from('system_logs').insert({
        level,
        message,
        details: details ?? null,
        timestamp: new Date().toISOString()
    });
    if (error) throw new Error(`system_logs insert failed: ${error.code ?? 'unknown'}`);
}
