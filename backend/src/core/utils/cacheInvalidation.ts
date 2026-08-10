import * as cacheService from '../database/cacheService';
import { invalidateUserMemoryCache } from '../database/userService';
import { invalidateStatsCache } from '../database/statsService';
import { logger } from './logger';
import { overlayStateKey, overlayRevokeKey } from '../overlay/keys';
import { invalidateUserInfoCache } from '../../features/twitch/twitchUserService';
import { ownerScopedCacheKey } from '../config/cacheTtl';

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

/**
 * Tras vincular/desvincular Discord: solo perfil y usuario en memoria.
 * NO toca Helix, overlay, stats ni API key — Discord es independiente de Twitch.
 */
export async function invalidateDiscordLinkCaches(
    userId: string,
    login?: string
): Promise<void> {
    const { invalidateUserCache } = await import('../middleware/apiKeyValidator');
    const { invalidateAuthCache, unrevokeAuthSession } = await import('../middleware/authMiddleware');
    invalidateUserCache(userId);
    invalidateUserMemoryCache(userId);
    invalidateAuthCache(userId, { revokeSession: false });
    // Discord no debe dejar la sesión revocada (ni heredar un flag de un bug previo).
    await unrevokeAuthSession(userId).catch(() => {});

    const tasks: Promise<void>[] = [
        cacheService.del(`cache:user:id:${userId}`),
        cacheService.del(`cache:dashboard:profile:${userId}`)
    ];
    if (login) {
        const normalized = login.toLowerCase();
        tasks.push(cacheService.del(`cache:user:login:${normalized}`));
        tasks.push(
            cacheService.del(ownerScopedCacheKey(userId, `cache:cmd:getUserInfo:login:${normalized}`))
        );
    }

    await Promise.allSettled(tasks).catch((e) =>
        logger.warn('Error invalidando caches de Discord:', e)
    );
}

/** Invalida todas las capas de caché conocidas para un usuario (auth, dashboard, stats). */
export async function invalidateAllUserCaches(
    userId: string,
    options: UserCacheInvalidationOptions = {}
): Promise<void> {
    const { invalidateUserCache } = await import('../middleware/apiKeyValidator');
    const { invalidateAuthCache } = await import('../middleware/authMiddleware');
    invalidateUserCache(userId);
    invalidateUserMemoryCache(userId);
    invalidateAuthCache(userId, { revokeSession: false });
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
