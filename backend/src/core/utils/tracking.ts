import * as dbService from '../database/dbService';
import { logger } from './logger';
import { ActivityLogEntry } from '../database/activityService';

/**
 * Wrapper universal para rastrear peticiones, métricas y actividad.
 * Unifica la lógica que antes estaba dispersa entre juegos y comandos.
 */
export const trackRequest = async <T>(
    userId: string | undefined,
    options: {
        type: ActivityLogEntry['type'];
        user?: string;
        detail?: string;
        incrementStat?: string;
        skipActivityLog?: boolean;
        skipRequestCount?: boolean; // Nueva opción para no contar como "Petición Hoy" (ej. carga perfil)
    },
    action: () => Promise<T>
): Promise<T> => {
    const startTime = Date.now();
    try {
        // Ejecutar la acción principal (ej. llamar a Twitch o generar respuesta)
        const result = await action();

        const latency = Date.now() - startTime;

        if (userId) {
            // Registro asíncrono pero esperado (AWAIT) para entornos serverless
            try {
                const tasks = [
                    dbService.recordUserRequest(userId, latency, true, options.skipRequestCount)
                ];

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

                await Promise.allSettled(tasks);
            } catch (metricsError) {
                logger.error('Error guardando métricas/actividad:', metricsError);
            }
        }

        return result;
    } catch (error) {
        const latency = Date.now() - startTime;
        if (userId) {
            try {
                // En caso de error, también respetamos si es una consulta que no debe contar
                await dbService.recordUserRequest(userId, latency, false, options.skipRequestCount);
            } catch (err) {
                logger.error('Error registrando métrica de fallo:', err);
            }
        }
        throw error;
    }
};
