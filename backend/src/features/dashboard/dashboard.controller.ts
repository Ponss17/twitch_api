import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';
import { resolveUserLimits } from '../../core/config/userRoles';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { buildEmptyUserAnalytics, buildAnalyticsPayload, isAnalyticsCacheFresh } from './dashboardHelpers';
import { buildDashboardProfile } from '../../core/utils/dashboardProfile';

import { AuthenticatedRequest } from '../../types/twitch';
import { TwitchApiError } from '../../core/errors/AppError';
import { AppError } from '../../core/errors/AppError';
import {
    invalidateAllUserCaches,
    invalidateDashboardStatsCaches,
    invalidateOverlayStateCaches
} from '../../core/utils/cacheInvalidation';
import { jsonError } from '../../core/utils/jsonResponse';
import { trackRequest } from '../../core/utils/tracking';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    }

    try {
        const cacheKey = `cache:dashboard:analytics:${userId}`;
        const statsRev = await cacheService.getStatsRevision(userId);
        const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
        if (cached && isAnalyticsCacheFresh(cached, statsRev)) {
            return res.json(cached);
        }

        const stats = await dbService.getUserStats(userId);
        const payload = buildAnalyticsPayload(stats, statsRev);

        await cacheService.set(
            cacheKey,
            payload,
            resolveCache('DASHBOARD_ANALYTICS', res.locals?.apiUser?.role, res.locals?.apiUser?.customCacheTtl)
        );
        res.json(payload);
    } catch (e) {
        logger.error('Error analytics:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const getLogs = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.json([]);

    try {
        const cacheKey = `cache:activity:${userId}`;
        const cached = await cacheService.get<unknown[]>(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const logs = await dbService.getUserActivity(userId);
        await cacheService.set(
            cacheKey,
            logs,
            resolveCache('ACTIVITY_FEED', res.locals?.apiUser?.role, res.locals?.apiUser?.customCacheTtl)
        );
        res.json(logs);
    } catch (e) {
        logger.error('Error logs activity:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.LOGS_ERROR);
    }
};

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const limitNum = parseInt(req.query.limit as string, 10) || 20;
    const userId = req.userId;

    return await trackRequest(
        userId,
        {
            type: 'other',
            user: channel,
            detail: 'Dashboard Clips',
            skipActivityLog: true,
            skipRequestCount: true
        },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached) return res.json(cached);

            try {
                const result = await apiService.getClips(channel, limitNum, req.twitchToken || '');
                await cacheService.set(
                    cacheKey,
                    result,
                    resolveCache('CLIPS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
                );
                return res.json(result);
            } catch (error: unknown) {
                if (error instanceof TwitchApiError) throw error;
                logger.error('Error fetching clips:', { error });
                throw new AppError(MESSAGES.DASHBOARD.CLIPS_ERROR, 500);
            }
        }
    );
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const eligibilityRaw = req.query.eligibility as string | undefined;
    const eligibility = apiService.parseEligibilityQuery(eligibilityRaw);
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    return await trackRequest(
        userId,
        {
            type: 'stalker',
            user: channel,
            incrementStat: 'stalker'
        },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getChatters:channel:${channel}:eligibility:${eligibilityRaw ?? 'all'}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached) return res.json(cached);

            try {
                const broadcasterId = await apiService.getUserId(channel, req.twitchToken || '');
                const chatters = await apiService.getChatters(
                    broadcasterId,
                    userId,
                    req.twitchToken || ''
                );
                const filtered = await apiService.filterChattersByEligibility(
                    chatters,
                    broadcasterId,
                    req.twitchToken || '',
                    eligibility
                );
                const payload =
                    eligibility === 'all'
                        ? filtered
                        : await apiService.annotateChatterRoles(
                              filtered,
                              broadcasterId,
                              req.twitchToken || ''
                          );
                await cacheService.set(
                    cacheKey,
                    payload,
                    resolveCache('CHATTERS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
                );
                return res.json(payload);
            } catch (error: unknown) {
                if (error instanceof TwitchApiError) throw error;
                const err = error as Error;
                logger.error('Error getting chatters:', { error: err.message });
                throw new AppError(MESSAGES.DASHBOARD.CHATTERS_ERROR, 500);
            }
        }
    );
};

export const trackToolUsage = async (req: AuthenticatedRequest, res: Response) => {
    const { tool } = req.body as { tool: 'trends' | 'stalker' | 'roulette' };
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await trackRequest(
            userId,
            {
                type: tool,
                user: req.login || 'User',
                incrementStat: tool
            },
            async () => ({ success: true })
        );
        res.json({ success: true });
    } catch (e) {
        logger.error('Error tracking tool usage:', e);
        return jsonError(res, 500, 'Error al registrar el uso de la herramienta.');
    }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
    const login = req.query.login as string;
    const userId = req.userId;

    return await trackRequest(
        userId,
        {
            type: 'other',
            user: login,
            detail: 'User Info Inspect',
            skipActivityLog: true,
            skipRequestCount: true
        },
        async () => {
            const apiUser = res.locals.apiUser;
            const limits = resolveUserLimits(apiUser);

            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getUserInfo:login:${login}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached && typeof cached === 'object') {
                return res.json({ ...cached, ...limits });
            }

            try {
                const info = await apiService.getUserInfo(login, req.twitchToken || '');
                const followers = await apiService.getFollowersCount(
                    info.id,
                    req.twitchToken || ''
                );

                const result = buildDashboardProfile(info, followers, limits);

                await cacheService.set(cacheKey, result, resolveCache('DASHBOARD_PROFILE', apiUser?.role, apiUser?.customCacheTtl));
                res.json({ ...result, ...limits, cacheTtl: resolveCache('COMMAND', apiUser?.role, apiUser?.customCacheTtl) });
            } catch {
                return jsonError(res, 500, MESSAGES.DASHBOARD.USER_INFO_ERROR);
            }
        }
    );
};

export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await dbService.clearUserStatsAndLogs(userId);
        await invalidateDashboardStatsCaches(userId, req.login);
        await invalidateOverlayStateCaches(userId);
        res.json({
            success: true,
            message: 'Estadísticas y actividad reiniciadas correctamente.',
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
        res.json({ success: true, message: 'Cuenta eliminada permanentemente del sistema.' });
    } catch (e) {
        logger.error('Error deleting account:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const getSummary = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const login = req.query.login as string;
    const userId = req.userId;
    const cacheId = userId || login?.toLowerCase() || '';

    const profileKey = cacheId ? `cache:dashboard:profile:${cacheId}` : null;
    const analyticsKey = userId && cacheId ? `cache:dashboard:analytics:${cacheId}` : null;
    const statsRev = userId ? await cacheService.getStatsRevision(userId) : 0;

    const [cachedProfile, cachedAnalytics] = await Promise.all([
        profileKey ? cacheService.get<Record<string, unknown>>(profileKey) : Promise.resolve(null),
        analyticsKey ? cacheService.get<Record<string, unknown>>(analyticsKey) : Promise.resolve(null)
    ]);

    const analyticsCacheHit =
        Boolean(cachedAnalytics) && isAnalyticsCacheFresh(cachedAnalytics, statsRev);

    const limits = resolveUserLimits(res.locals?.apiUser);

    const mergeProfileLimits = (profile: Record<string, unknown> | null) => {
        if (!profile) return profile;
        return {
            ...profile,
            role: limits.role,
            roleLabel: limits.roleLabel,
            rateLimit: limits.rateLimit,
            cacheTtl: resolveCache('COMMAND', res.locals?.apiUser?.role, res.locals?.apiUser?.customCacheTtl),
            hasCustomRateLimit: limits.hasCustomRateLimit,
            hasCustomCacheTtl: limits.hasCustomCacheTtl
        };
    };

    if (cachedProfile && (!userId || analyticsCacheHit)) {
        return res.json({
            profile: mergeProfileLimits(cachedProfile),
            analytics: cachedAnalytics ?? null
        });
    }

    try {
        const needProfile = !cachedProfile;
        const needAnalytics = Boolean(userId && !analyticsCacheHit);

        const [profile, analytics] = await Promise.all([
            needProfile
                ? (async () => {
                      const info = await apiService.getUserInfo(login, token || '');
                      const followers = await apiService.getFollowersCount(info.id, token || '');
                      const limits = resolveUserLimits(res.locals.apiUser);
                      return {
                          ...buildDashboardProfile(info, followers, limits),
                          ...limits
                      };
                  })()
                : Promise.resolve(cachedProfile),
            needAnalytics && userId
                ? (async () => {
                      const stats = await dbService.getUserStats(userId);
                      return buildAnalyticsPayload(stats, statsRev);
                  })()
                : Promise.resolve(cachedAnalytics ?? null)
        ]);

        if (needProfile && profileKey && profile) {
            await cacheService.set(
                profileKey,
                profile,
                resolveCache('DASHBOARD_PROFILE', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
            );
        }
        if (needAnalytics && analyticsKey && analytics) {
            await cacheService.set(
                analyticsKey,
                analytics,
                resolveCache('DASHBOARD_ANALYTICS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
            );
        }

        res.json({
            profile: mergeProfileLimits(
                profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : null
            ),
            analytics: analytics ?? null
        });
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        logger.error('Error in getSummary:', error);
        throw new AppError(MESSAGES.DASHBOARD.USER_INFO_ERROR, 500);
    }
};


export const exportCheck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const key = `export_cooldown:${userId}`;
    
    try {
        const cachedExpiresAt = await cacheService.get<number>(key);
        if (cachedExpiresAt) {
            const remainingMins = Math.max(1, Math.ceil((cachedExpiresAt - Date.now()) / 60000));
            return jsonError(
                res,
                429,
                `Debes esperar ${remainingMins} minuto${remainingMins > 1 ? 's' : ''} para generar otro reporte.`,
                { code: 'RATE_LIMITED' }
            );
        }
        
        res.json({ success: true });
    } catch (e) {
        logger.error('Error checking export rate limit:', e);
        return jsonError(res, 500, 'Error al verificar límite de exportación.');
    }
};

export const recordExportComplete = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const key = `export_cooldown:${userId}`;
    const COOLDOWN_MINUTES = 4;

    try {
        await cacheService.set(key, Date.now() + COOLDOWN_MINUTES * 60000, COOLDOWN_MINUTES * 60);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error recording export cooldown:', e);
        return jsonError(res, 500, 'Error al registrar exportación.');
    }
};
