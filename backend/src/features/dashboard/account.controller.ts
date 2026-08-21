import { safeString } from '../../core/utils/validationHelpers';
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
import { invalidateAllUserCaches, invalidateDashboardStatsCaches, invalidateOverlayStateCaches, invalidateUserPlanCaches } from '../../core/utils/cacheInvalidation';
import { clearSessionCookie } from '../../core/utils/sessionCookie';
import { jsonError } from '../../core/utils/jsonResponse';
import { maskApiKey } from '../../core/utils/maskApiKey';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { revokeSessions } from '../../core/utils/sessionState';
import { overlayRevokeKey } from '../../core/overlay/keys';
import { invalidateAuthCache } from '../../core/middleware/authMiddleware';
import * as questionsService from '../../core/database/questionsService';
import type { StoredUser } from '../../types/twitch';

function requestWantsFreshData(req: AuthenticatedRequest): boolean {
    const fresh = req.query?.fresh;
    return fresh === '1' || fresh === 'true';
}

async function reloadApiUserFromDb(
    req: AuthenticatedRequest,
    res: Response,
    userId: string
): Promise<StoredUser | null> {
    await invalidateUserPlanCaches(userId, req.login);
    const user = await dbService.getUser(userId);
    if (user) {
        res.locals.apiUser = user;
        req.userTimezone = user.timezone ?? req.userTimezone;
    }
    return user;
}

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
    const login = safeString(req.query.login);
    const userId = req.userId;
    const wantFresh = requestWantsFreshData(req);

    if (wantFresh && userId) {
        await reloadApiUserFromDb(req, res, userId);
    }

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
                if (!wantFresh) {
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

export const getUserAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const rawPage = req.query?.page ?? (res.locals?.query as { page?: unknown } | undefined)?.page;
    const page = Number(rawPage) || 1;

    try {
        const payload = await dbService.getUserAuditLogs(userId, page);
        res.setHeader('Cache-Control', 'no-store');
        return res.json(payload);
    } catch (e) {
        logger.error('Error leyendo audit logs:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const clearStats = req.body?.scopes?.stats ?? true;
    const clearQuestions = req.body?.scopes?.questions ?? true;

    try {
        if (clearStats) {
            await dbService.clearUserStatsAndLogs(userId);
            await Promise.all([
                invalidateDashboardStatsCaches(userId, req.login),
                invalidateOverlayStateCaches(userId),
                cacheService.del(`cache:activity:${userId}`),
                cacheService.del(`cache:dashboard:analytics:${userId}`),
                cacheService.del(`cache:analytics:${userId}`)
            ]);
        }

        if (clearQuestions) {
            try {
                await questionsService.clearStreamerQuestions(userId, false);
            } catch (questionsErr) {
                logger.warn(
                    'clearUserData: streamer_questions wipe skipped:',
                    (questionsErr as Error).message
                );
            }
        }

        const parts: string[] = [];
        if (clearStats) parts.push('estadísticas y actividad');
        if (clearQuestions) parts.push('historial de preguntas');

        await dbService.addAuditLog('stats_cleared', userId, userId, {
            stats: clearStats,
            questions: clearQuestions
        });

        res.json({
            success: true,
            message: `Se borró: ${parts.join(' y ')}.`,
            cleared: { stats: clearStats, questions: clearQuestions },
            analytics: clearStats ? buildEmptyUserAnalytics() : undefined,
            activity: clearStats ? ([] as unknown[]) : undefined
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
        const storedUser = apiUser?.apiKey ? null : await dbService.getUser(userId);
        const apiKey = apiUser?.apiKey ?? storedUser?.apiKey;
        await revokeSessions(userId);
        await cacheService.setSensitive(
            overlayRevokeKey(userId),
            Date.now(),
            30 * 24 * 60 * 60
        );
        if (apiKey) {
            await cacheService.revokeApiKeyGlobally(apiKey);
        }
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