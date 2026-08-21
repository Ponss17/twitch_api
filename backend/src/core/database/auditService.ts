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
    | 'session_login'
    | 'session_logout'
    | 'api_key_regenerated'
    | 'api_key_revealed'
    | 'user_deleted'
    | 'user_blocked'
    | 'user_unblocked'
    | 'stats_cleared'
    | 'discord_linked'
    | 'discord_unlinked';

/** Eventos que el streamer puede ver en Ajustes → Seguridad. */
export const USER_AUDIT_ACTIONS = [
    'session_login',
    'session_logout',
    'api_key_regenerated',
    'api_key_revealed',
    'discord_linked',
    'discord_unlinked',
    'stats_cleared'
] as const satisfies readonly AuditAction[];

export type UserAuditAction = (typeof USER_AUDIT_ACTIONS)[number];

export const USER_AUDIT_PAGE_SIZE = 20;

export interface AuditLogEntry {
    timestamp: string;
    action: AuditAction;
    userId: string;
    performedBy?: string;
    metadata?: Record<string, unknown>;
}

export interface UserAuditLogEntry {
    action: UserAuditAction;
    createdAt: string;
    scopes?: { stats: boolean; questions: boolean };
}

export interface UserAuditLogsPage {
    logs: UserAuditLogEntry[];
    page: number;
    pageSize: number;
    total: number;
}

const USER_AUDIT_ACTION_SET = new Set<string>(USER_AUDIT_ACTIONS);

function isUserAuditAction(action: string): action is UserAuditAction {
    return USER_AUDIT_ACTION_SET.has(action);
}

function scopesFromMetadata(metadata: unknown): { stats: boolean; questions: boolean } | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;
    const row = metadata as Record<string, unknown>;
    if (typeof row.stats !== 'boolean' && typeof row.questions !== 'boolean') return undefined;
    return {
        stats: row.stats === true,
        questions: row.questions === true
    };
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

export const getUserAuditLogs = async (
    userId: string,
    page = 1
): Promise<UserAuditLogsPage> => {
    const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    const from = (safePage - 1) * USER_AUDIT_PAGE_SIZE;
    const to = from + USER_AUDIT_PAGE_SIZE - 1;
    const empty: UserAuditLogsPage = {
        logs: [],
        page: safePage,
        pageSize: USER_AUDIT_PAGE_SIZE,
        total: 0
    };

    try {
        const { data, error, count } = await supabase
            .from('audit_logs')
            .select('action, created_at, metadata', { count: 'exact' })
            .eq('user_id', userId)
            .in('action', [...USER_AUDIT_ACTIONS])
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error || !data) {
            if (error) logger.warn('No se pudieron leer los logs de auditoría:', error.message);
            return empty;
        }

        const logs: UserAuditLogEntry[] = [];
        for (const row of data) {
            const action = String(row.action ?? '');
            if (!isUserAuditAction(action)) continue;
            const createdAt = typeof row.created_at === 'string' ? row.created_at : '';
            if (!createdAt) continue;
            const entry: UserAuditLogEntry = { action, createdAt };
            if (action === 'stats_cleared') {
                const scopes = scopesFromMetadata(row.metadata);
                if (scopes) entry.scopes = scopes;
            }
            logs.push(entry);
        }

        return {
            logs,
            page: safePage,
            pageSize: USER_AUDIT_PAGE_SIZE,
            total: typeof count === 'number' && count >= 0 ? count : logs.length
        };
    } catch (e) {
        logger.warn('No se pudieron leer los logs de auditoría:', (e as Error).message);
        return empty;
    }
};
