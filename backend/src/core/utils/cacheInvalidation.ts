import * as cacheService from '../database/cacheService';
import { invalidateUserMemoryCache } from '../database/userService';
import { invalidateUserCache } from '../middleware/apiKeyValidator';
import { invalidateStatsCache } from '../database/statsService';
import { logger } from './logger';

export interface UserCacheInvalidationOptions {
    apiKey?: string;
    login?: string;
    /** Solo al regenerar key o eliminar cuenta — no al limpiar stats. */
    revokeApiKey?: boolean;
}

/** Tras reiniciar estadísticas: dashboard + stats, sin revocar API key. */
export async function invalidateDashboardStatsCaches(
    userId: string,
    login?: string
): Promise<void> {
    invalidateUserMemoryCache(userId);
    invalidateStatsCache(userId);

    await Promise.allSettled([
        cacheService.invalidateDashboardCache(userId, login),
        cacheService.invalidateDashboardAnalytics(userId),
        cacheService.bumpStatsRevision(userId)
    ]).catch((e) => logger.error('Error invalidando caches de stats:', e));
}

/** Invalida todas las capas de caché conocidas para un usuario (auth, dashboard, stats). */
export async function invalidateAllUserCaches(
    userId: string,
    options: UserCacheInvalidationOptions = {}
): Promise<void> {
    invalidateUserCache(userId);
    invalidateUserMemoryCache(userId);
    invalidateStatsCache(userId);

    const tasks: Promise<void>[] = [
        cacheService.invalidateDashboardCache(userId, options.login),
        cacheService.bumpStatsRevision(userId)
    ];

    if (options.revokeApiKey && options.apiKey) {
        tasks.push(cacheService.invalidateApiKeyCache(options.apiKey));
        tasks.push(cacheService.revokeApiKeyGlobally(options.apiKey));
    }

    await Promise.allSettled(tasks).catch((e) =>
        logger.error('Error invalidando caches de usuario:', e)
    );
}
