import * as dbService from '../database/dbService';
import { logger } from './logger';
import { ActivityLogEntry } from '../database/activityService';

type TrackRequestOptions = {
    type: ActivityLogEntry['type'];
    user?: string;
    detail?: string;
    incrementStat?: string;
    skipActivityLog?: boolean;
    skipRequestCount?: boolean;
};

/** Métricas en background — no bloquea la respuesta al bot/cliente. */
function persistRequestMetrics(
    userId: string,
    options: TrackRequestOptions,
    latency: number,
    success: boolean
): Promise<void> {
    const tasks: Promise<unknown>[] = [
        dbService.recordUserRequest(userId, latency, success, options.skipRequestCount)
    ];

    if (success) {
        if (options.incrementStat) {
            tasks.push(dbService.incrementUserStats(userId, options.incrementStat));
        }

        if (!options.skipActivityLog) {
            tasks.push(
                dbService.addUserActivity(userId, {
                    type: options.type,
                    user: options.user || 'Anónimo',
                    detail: options.detail
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

/**
 * Wrapper universal para rastrear peticiones, métricas y actividad.
 * Unifica la lógica que antes estaba dispersa entre juegos y comandos.
 */
export const trackRequest = async <T>(
    userId: string | undefined,
    options: TrackRequestOptions,
    action: () => Promise<T>
): Promise<T> => {
    const startTime = Date.now();
    try {
        // Ejecutar la acción principal (ej. llamar a Twitch o generar respuesta)
        const result = await action();

        const latency = Date.now() - startTime;

        if (userId) {
            void persistRequestMetrics(userId, options, latency, true);
        }

        return result;
    } catch (error) {
        const latency = Date.now() - startTime;
        if (userId) {
            void persistRequestMetrics(userId, options, latency, false);
        }
        throw error;
    }
};
