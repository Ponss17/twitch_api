import * as cacheService from '../database/cacheService';
import { invalidateUserMemoryCache } from '../database/userService';
import { invalidateStatsCache } from '../database/statsService';
import { logger } from './logger';
import { overlayStateKey } from '../../features/dashboard/overlay/keys';
import { invalidateUserInfoCache } from '../../features/twitch/twitchUserService';

const overlayRevokeKey = (userId: string): string => `cache:overlay:revoke:${userId}`;

export async function invalidateHelixUserCaches(userId: string, login?: string): Promise<void> {
    invalidateUserInfoCache(login, userId);
    const keys = [
        `cache:eligibility:mods:${userId}`,
        `cache:eligibility:vips:${userId}`,
        `cache:eligibility:subs:${userId}`,
        `twitch:channel:${userId}`,
        `cache:chatters:${userId}`
    ];
    if (login) {
        keys.push(`cache:userId:${login.toLowerCase()}`);
    }
    await Promise.allSettled(keys.map((key) => cacheService.del(key))).catch((e) =>
        logger.warn('Error invalidando caches Helix:', e)
    );
}

export async function invalidateOverlayStateCaches(userId: string): Promise<void> {
    await Promise.allSettled([
        cacheService.del(overlayStateKey(userId, 'roulette')),
        cacheService.del(overlayStateKey(userId, 'trends'))
    ]).catch((e) => logger.warn('Error invalidando estado overlay:', e));
}

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
    const { invalidateUserCache } = await import('../middleware/apiKeyValidator');
    invalidateUserCache(userId);
    invalidateUserMemoryCache(userId);
    invalidateStatsCache(userId);

    const tasks: Promise<void>[] = [
        cacheService.del(`cache:user:id:${userId}`),
        ...(options.login ? [cacheService.del(`cache:user:login:${options.login.toLowerCase()}`)] : []),
        cacheService.invalidateDashboardCache(userId, options.login),
        cacheService.bumpStatsRevision(userId),
        invalidateOverlayStateCaches(userId),
        cacheService.set(overlayRevokeKey(userId), Date.now(), 30 * 24 * 3600),
        invalidateHelixUserCaches(userId, options.login)
    ];

    if (options.revokeApiKey && options.apiKey) {
        tasks.push(cacheService.invalidateApiKeyCache(options.apiKey));
        tasks.push(cacheService.revokeApiKeyGlobally(options.apiKey));
    }

    await Promise.allSettled(tasks).catch((e) =>
        logger.error('Error invalidando caches de usuario:', e)
    );
}
