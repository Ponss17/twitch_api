import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';



export const addSystemLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, unknown>
): Promise<void> => {
    if (process.env.SUPABASE_URL?.includes('example.supabase.co')) {
        return;
    }

    try {
        const { error } = await supabase.from('system_logs').insert({
            level,
            message,
            details: details ?? null,
            timestamp: new Date().toISOString()
        });

        if (error) console.error('Failed to log to Supabase:', error.message);
    } catch (_e) {
        console.error('Failed to log to Supabase:', _e);
    }
};



// ==========================================
// Log de Auditoría (Acciones Sensibles)
// ==========================================

export type AuditAction =
    | 'api_key_regenerated'
    | 'api_key_revealed'
    | 'user_deleted'
    | 'user_blocked'
    | 'user_unblocked'
    | 'stats_cleared'
    | 'discord_linked'
    | 'discord_unlinked';

export interface AuditLogEntry {
    timestamp: string;
    action: AuditAction;
    userId: string;
    performedBy?: string;
    metadata?: Record<string, unknown>;
}

export const addAuditLog = async (
    action: AuditAction,
    userId: string,
    performedBy?: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    try {
        const { error } = await supabase.from('audit_logs').insert({
            action,
            user_id: userId,
            performed_by: performedBy ?? null,
            metadata: metadata ?? null,
            created_at: new Date().toISOString()
        });

        if (error) logger.warn('No se pudo guardar el log de auditoría:', error.message);
    } catch (e) {
        logger.warn('No se pudo guardar el log de auditoría:', (e as Error).message);
    }
};

export const getAuditLogs = async (limit = 100): Promise<AuditLogEntry[]> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(Math.min(limit, 500));

        if (error || !data) return [];

        return data.map((row) => ({
            timestamp: row.created_at as string,
            action: row.action as AuditAction,
            userId: row.user_id as string,
            performedBy: (row.performed_by as string) ?? undefined,
            metadata: (row.metadata as Record<string, unknown>) ?? undefined
        }));
    } catch (_e) {
        return [];
    }
};
