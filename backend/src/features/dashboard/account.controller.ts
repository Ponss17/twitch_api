import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import * as apiService from '../twitch/twitch.service';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';
import { resolveUserLimits } from '../../core/config/userRoles';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { buildEmptyUserAnalytics } from './dashboardHelpers';
import { buildDashboardProfile } from '../../core/utils/dashboardProfile';
import { AuthenticatedRequest } from '../../types/twitch';
import { invalidateAllUserCaches, invalidateDashboardStatsCaches, invalidateOverlayStateCaches } from '../../core/utils/cacheInvalidation';
import { clearSessionCookie } from '../../core/utils/sessionCookie';
import { invalidateAuthCache } from '../../core/middleware/authMiddleware';
import { jsonError } from '../../core/utils/jsonResponse';
import { maskApiKey } from '../../core/utils/maskApiKey';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';

export const revealApiKey = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const apiUser = res.locals?.apiUser as { apiKey?: string } | undefined;
        let apiKey = apiUser?.apiKey;

        if (!apiKey) {
            const user = await dbService.getUser(userId);
            apiKey = user?.apiKey;
        }

        if (!apiKey) {
            return jsonError(res, 404, 'No se encontro API Key para esta cuenta.', { code: 'API_KEY_NOT_FOUND' });
        }

        res.setHeader('Cache-Control', 'no-store');
        const safeIp = (req.ip || 'unknown').replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);
        await dbService.addAuditLog('api_key_revealed', userId, userId);
        logger.info('api_key_revealed', { event: 'api_key_revealed', userId, ip: safeIp, at: new Date().toISOString() });
        return res.json({ apiKey, masked: maskApiKey(apiKey) });
    } catch (e) {
        logger.error('Error revealing API key:', e);
        return jsonError(res, 500, MESSAGES.SYSTEM.REGENERATE_KEY_ERROR);
    }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
    const login = req.query.login as string;
    const userId = req.userId;

    const result = await trackRequest(
        userId,
        { type: 'other', user: login, metadata: { action: 'User Info Inspect' }, skipActivityLog: true, skipRequestCount: true },
        async () => {
            const apiUser = res.locals.apiUser;
            const limits = resolveUserLimits(apiUser);

            return withTwitchAuth(req, res, async (token) => {
                const cacheKey = ownerScopedCacheKey(userId, `cache:cmd:getUserInfo:login:${login}`);
                const timezone = apiUser?.timezone || 'UTC';
                const discordFields = userId ? await dbService.getDiscordLinkFields(userId) : null;
                const cached = await cacheService.get(cacheKey);
                if (cached && typeof cached === 'object') {
                    return {
                        ...cached,
                        ...limits,
                        timezone,
                        ...(discordFields ?? {}),
                        dbCreatedAt: apiUser?.createdAt,
                        dbLastActive: apiUser?.lastActive
                    };
                }

                const info = await apiService.getUserInfo(login, token);
                // followers/isLive son secundarios: si Twitch falla (p. ej. falta el
                // scope moderator:read:followers) degradamos sin romper el perfil.
                const [followers, isLive] = await Promise.all([
                    apiService.getFollowersCountSafe(info.id, token),
                    apiService.isStreamLiveSafe(info.id, token, apiUser?.role)
                ]);
                const degraded = followers === undefined || isLive === undefined;
                const profileResult = buildDashboardProfile(
                    info,
                    followers,
                    isLive,
                    limits,
                    discordFields ?? {
                        discordId: apiUser?.discordId,
                        discordUsername: apiUser?.discordUsername,
                        discordAvatar: apiUser?.discordAvatar
                    }
                );
                if (!degraded) {
                    await cacheService.set(cacheKey, profileResult, resolveCache('DASHBOARD_PROFILE', apiUser?.role, apiUser?.customCacheTtl));
                }
                return { 
                    ...profileResult, 
                    ...limits, 
                    timezone, 
                    cacheTtl: limits.cacheTtl,
                    dbCreatedAt: apiUser?.createdAt,
                    dbLastActive: apiUser?.lastActive
                };
            }, 'getUserInfo');
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) return jsonError(res, 404, MESSAGES.DASHBOARD.USER_INFO_ERROR, { code: 'NOT_FOUND' });
};

export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await dbService.clearUserStatsAndLogs(userId);
        await Promise.all([
            invalidateDashboardStatsCaches(userId, req.login),
            invalidateOverlayStateCaches(userId),
            cacheService.del(`cache:activity:${userId}`),
            cacheService.del(`cache:dashboard:analytics:${userId}`),
            cacheService.del(`cache:analytics:${userId}`)
        ]);
        res.json({
            success: true,
            message: 'Estadisticas y actividad reiniciadas correctamente.',
            analytics: buildEmptyUserAnalytics(),
            activity: [] as unknown[]
        });
    } catch (e) {
        logger.error('Error clearing user data:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const apiUser = res.locals?.apiUser as { apiKey?: string } | undefined;
        const apiKey = apiUser?.apiKey;
        await dbService.deleteUser(userId);
        await invalidateAllUserCaches(userId, { apiKey, login: req.login, revokeApiKey: true });
        invalidateAuthCache(userId);
        clearSessionCookie(res);
        res.json({ success: true, message: 'Cuenta eliminada permanentemente del sistema.' });
    } catch (e) {
        logger.error('Error deleting account:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};