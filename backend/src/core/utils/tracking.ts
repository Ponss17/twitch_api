import * as dbService from '../database/dbService';
import { logger } from './logger';
import { ActivityLogEntry } from '../database/activityService';
import type { Request } from 'express';
import { normalizeLanguage } from './time';

type TrackRequestOptions = {
    type: ActivityLogEntry['type'];
    user?: string;
    metadata?: Record<string, unknown>;
    incrementStat?: string;
    skipActivityLog?: boolean;
    skipRequestCount?: boolean;
    /** Timezone IANA del usuario (ej. 'America/Costa_Rica'). Se pasa explícitamente para evitar
     *  que en cold starts de Vercel se use UTC como fallback al calcular la fecha local. */
    userTimezone?: string;
};

const MAX_ACTIVITY_RESPONSE_CHARS = 800;

const SENSITIVE_QUERY_RE =
    /([?&](?:api[_-]?key|token|access[_-]?token|refresh[_-]?token|overlay[_-]?token)=)[^&#]*/gi;

const ACTIVITY_CONTEXT_KEYS = ['lang', 'format', 'mood', 'channel', 'hardcore', 'source'] as const;

function firstParamString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    return '';
}

/** Extrae contexto seguro del request (idioma, formato, etc.) para activity_logs. */
export function activityContextFromRequest(req?: Request): Record<string, string> {
    if (!req) return {};
    const body =
        req.method !== 'GET' && req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? (req.body as Record<string, unknown>)
            : {};
    const source: Record<string, unknown> = { ...body, ...(req.query as Record<string, unknown>) };
    const out: Record<string, string> = {};
    for (const key of ACTIVITY_CONTEXT_KEYS) {
        const raw = firstParamString(source[key]);
        if (!raw || raw.includes('$(') || raw.includes('${') || raw.length > 64) continue;
        out[key] = key === 'lang' ? normalizeLanguage(raw) : raw;
    }
    return out;
}

function buildActivityMetadata(
    options: TrackRequestOptions,
    latency: number,
    actionResult: unknown | undefined,
    req?: Request
): Record<string, unknown> {
    const fromReq = activityContextFromRequest(req);
    const metadata: Record<string, unknown> = {
        ...fromReq,
        ...(options.metadata ?? {}),
        latencyMs: latency
    };
    // Evitar duplicar channel cuando ya está como target.
    if (
        typeof metadata.target === 'string' &&
        typeof metadata.channel === 'string' &&
        metadata.target === metadata.channel
    ) {
        delete metadata.channel;
    }
    const response = summarizeActivityResponse(actionResult);
    if (response) metadata.response = response;
    return metadata;
}

/** Resume el resultado de un comando para activity_logs (sin volcar objetos enormes). */
export function summarizeActivityResponse(result: unknown): string | undefined {
    if (result == null) return undefined;

    const trim = (text: string): string => {
        const cleaned = text.replace(SENSITIVE_QUERY_RE, '$1**************').trim();
        if (!cleaned) return '';
        return cleaned.length > MAX_ACTIVITY_RESPONSE_CHARS
            ? `${cleaned.slice(0, MAX_ACTIVITY_RESPONSE_CHARS)}…`
            : cleaned;
    };

    if (typeof result === 'string') {
        const out = trim(result);
        return out || undefined;
    }
    if (typeof result === 'number' || typeof result === 'boolean') {
        return String(result);
    }
    if (typeof result === 'object') {
        const obj = result as Record<string, unknown>;
        if (typeof obj.message === 'string') {
            const out = trim(obj.message);
            if (out) return out;
        }
        if (typeof obj.text === 'string') {
            const out = trim(obj.text);
            if (out) return out;
        }
        if (Array.isArray(obj.messages)) {
            const joined = obj.messages.filter((m): m is string => typeof m === 'string').join(' · ');
            const out = trim(joined);
            if (out) return out;
        }
        try {
            const json = JSON.stringify(result);
            const out = trim(json);
            return out || undefined;
        } catch {
            return undefined;
        }
    }
    return undefined;
}

/** Métricas en background — no bloquea la respuesta al bot/cliente. */
function persistRequestMetrics(
    userId: string,
    options: TrackRequestOptions,
    latency: number,
    success: boolean,
    actionResult?: unknown,
    req?: Request
): Promise<void> {
    const tasks: Promise<unknown>[] = [
        dbService.recordUserRequest(
            userId,
            latency,
            success,
            options.incrementStat ?? null,
            options.skipRequestCount,
            options.userTimezone
        )
    ];

    if (success) {
        if (!options.skipActivityLog) {
            tasks.push(
                dbService.addUserActivity(userId, {
                    type: options.type,
                    user: options.user || 'Anónimo',
                    metadata: buildActivityMetadata(options, latency, actionResult, req)
                })
            );
        }
    }

    return Promise.allSettled(tasks).then((results) => {
        for (const r of results) {
            if (r.status === 'rejected') {
                logger.error('Error guardando métricas/actividad:', r.reason);
            }
        }
    });
}

function scheduleBackground(work: Promise<unknown>): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { waitUntil } = require('@vercel/functions') as {
            waitUntil?: (p: Promise<unknown>) => void;
        };
        if (typeof waitUntil === 'function') {
            waitUntil(work);
            return;
        }
    } catch {
        /* fuera de Vercel */
    }
    void work;
}

/**
 * Wrapper universal para rastrear peticiones, métricas y actividad.
 * Unifica la lógica que antes estaba dispersa entre juegos y comandos.
 *
 * @param req - Express request opcional. Si se pasa, extrae `req.userTimezone` automáticamente
 *              para garantizar la fecha local correcta en cold starts de Vercel.
 */
export const trackRequest = async <T>(
    userId: string | undefined,
    options: TrackRequestOptions,
    action: () => Promise<T>,
    req?: Request
): Promise<T> => {
    // Si el req está disponible y la timezone no fue seteada manualmente, extraerla del request
    const resolvedOptions: TrackRequestOptions =
        req && !options.userTimezone
            ? {
                  ...options,
                  userTimezone: (req as Request & { userTimezone?: string }).userTimezone
              }
            : options;

    const startTime = Date.now();
    try {
        const result = await action();
        const latency = Date.now() - startTime;

        if (userId) {
            scheduleBackground(
                persistRequestMetrics(userId, resolvedOptions, latency, true, result, req).catch((err) => {
                    logger.error('Error en métricas background (éxito):', err);
                })
            );
        }

        return result;
    } catch (error) {
        const latency = Date.now() - startTime;
        if (userId) {
            scheduleBackground(
                persistRequestMetrics(userId, resolvedOptions, latency, false, undefined, req).catch((err) => {
                    logger.error('Error en métricas background (fallo):', err);
                })
            );
        }
        throw error;
    }
};
