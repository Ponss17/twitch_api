import { kv } from '@vercel/kv';
import { logger } from '../utils/logger';
import { LOGS_KEY, AUDIT_LOGS_KEY, MAX_LOGS, MAX_AUDIT_LOGS } from './keys';

// ==========================================
// Integración de Logs del Sistema
// ==========================================

export interface SystemLogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    details?: Record<string, unknown>;
}

export const addSystemLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    details?: Record<string, unknown>
): Promise<void> => {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        };
        await kv.lpush(LOGS_KEY, JSON.stringify(logEntry));
        await kv.ltrim(LOGS_KEY, 0, MAX_LOGS - 1);
    } catch (_e) {
        logger.error('Failed to log to KV:', _e);
    }
};

export const getSystemLogs = async (): Promise<SystemLogEntry[]> => {
    try {
        const logs = await kv.lrange(LOGS_KEY, 0, -1);
        return logs.map((l) => (typeof l === 'string' ? JSON.parse(l) : l)) as SystemLogEntry[];
    } catch (_e) {
        return [];
    }
};

export const clearSystemLogs = async (): Promise<void> => {
    await kv.del(LOGS_KEY);
};

// ==========================================
// Log de Auditoría (Acciones Sensibles)
// ==========================================

export type AuditAction =
    | 'api_key_regenerated'
    | 'user_deleted'
    | 'user_blocked'
    | 'user_unblocked'
    | 'admin_added'
    | 'admin_removed'
    | 'stats_cleared';

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
        const entry: AuditLogEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            ...(performedBy && { performedBy }),
            ...(metadata && { metadata })
        };
        await kv.lpush(AUDIT_LOGS_KEY, JSON.stringify(entry));
        await kv.ltrim(AUDIT_LOGS_KEY, 0, MAX_AUDIT_LOGS - 1);
    } catch (e) {
        logger.warn('No se pudo guardar el log de auditoría:', (e as Error).message);
    }
};

export const getAuditLogs = async (limit = 100): Promise<AuditLogEntry[]> => {
    try {
        const logs = await kv.lrange(AUDIT_LOGS_KEY, 0, limit - 1);
        return logs.map((l) => (typeof l === 'string' ? JSON.parse(l) : l)) as AuditLogEntry[];
    } catch (_e) {
        return [];
    }
};
