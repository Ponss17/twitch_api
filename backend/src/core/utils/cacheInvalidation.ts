import * as cacheService from '../database/cacheService';
import { invalidateUserMemoryCache } from '../database/userService';
import { invalidateUserCache } from '../middleware/apiKeyValidator';
import { invalidateStatsCache } from '../database/statsService';
import { logger } from './logger';

export interface UserCacheInvalidationOptions {
    apiKey?: string;
    login?: string;
}

/** Invalida todas las capas de caché conocidas para un usuario (auth, dashboard, stats). */
export async function invalidateAllUserCaches(
    userId: string,
    options: UserCacheInvalidationOptions = {}
): Promise<void> {
    invalidateUserCache(userId);
    invalidateUserMemoryCache(userId);
    invalidateStatsCache(userId);

    const tasks: Promise<void>[] = [cacheService.invalidateDashboardCache(userId, options.login)];

    if (options.apiKey) {
        tasks.push(cacheService.invalidateApiKeyCache(options.apiKey));
    }

    await Promise.allSettled(tasks).catch((e) =>
        logger.error('Error invalidando caches de usuario:', e)
    );
}
