import * as dbService from '../database/dbService';
import { logger } from './logger';
import { ActivityLogEntry } from '../database/activityService';
import type { Request } from 'express';

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

/** Métricas en background — no bloquea la respuesta al bot/cliente. */
function persistRequestMetrics(
    userId: string,
    options: TrackRequestOptions,
    latency: number,
    success: boolean
): Promise<void> {
    const tasks: Promise<unknown>[] = [
        dbService.recordUserRequest(userId, latency, success, options.incrementStat ?? null, options.skipRequestCount, options.userTimezone)
    ];

    if (success) {
        if (!options.skipActivityLog) {
            tasks.push(
                dbService.addUserActivity(userId, {
                    type: options.type,
                    user: options.user || 'Anónimo',
                    metadata: options.metadata
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
    const resolvedOptions: TrackRequestOptions = req && !options.userTimezone
        ? { ...options, userTimezone: (req as Request & { userTimezone?: string }).userTimezone }
        : options;

    const startTime = Date.now();
    try {
        const result = await action();
        const latency = Date.now() - startTime;

        if (userId) {
            scheduleBackground(
                persistRequestMetrics(userId, resolvedOptions, latency, true).catch((err) => {
                    logger.error('Error en métricas background (éxito):', err);
                })
            );
        }

        return result;
    } catch (error) {
        const latency = Date.now() - startTime;
        if (userId) {
            scheduleBackground(
                persistRequestMetrics(userId, resolvedOptions, latency, false).catch((err) => {
                    logger.error('Error en métricas background (fallo):', err);
                })
            );
        }
        throw error;
    }
};
