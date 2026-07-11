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

        const [stats, dailyStats] = await Promise.all([
            dbService.getUserStats(userId),
            dbService.getDailyStats(userId, 7)
        ]);
        const payload = buildAnalyticsPayload(stats, statsRev);
        payload.timeSeries = dailyStats;

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

    const result = await trackRequest(
        userId,
        {
            type: 'other',
            user: channel,
            metadata: { action: 'Dashboard Clips' },
            skipActivityLog: true,
            skipRequestCount: true
        },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`
            );
            const cached = await cacheService.get(cacheKey);
            if (cached) return cached;

            try {
                const apiResult = await apiService.getClips(channel, limitNum, req.twitchToken || '');
                await cacheService.set(
                    cacheKey,
                    apiResult,
                    resolveCache('CLIPS', res.locals.apiUser?.role, res.locals.apiUser?.customCacheTtl)
                );
                return apiResult;
            } catch (error: unknown) {
                if (error instanceof TwitchApiError) throw error;
                logger.error('Error fetching clips:', { error });
                throw new AppError(MESSAGES.DASHBOARD.CLIPS_ERROR, 500);
            }
        }
    );

    if (result) return res.json(result);
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const eligibilityRaw = req.query.eligibility as string | undefined;
    const eligibility = apiService.parseEligibilityQuery(eligibilityRaw);
    const userId = req.userId;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const result = await trackRequest(
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
            if (cached) return cached;

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
                return payload;
            } catch (error: unknown) {
                if (error instanceof TwitchApiError) throw error;
                const err = error as Error;
                logger.error('Error getting chatters:', { error: err.message });
                throw new AppError(MESSAGES.DASHBOARD.CHATTERS_ERROR, 500);
            }
        }
    );

    if (result) return res.json(result);
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

    const result = await trackRequest(
        userId,
        {
            type: 'other',
            user: login,
            metadata: { action: 'User Info Inspect' },
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
            const timezone = apiUser?.timezone || 'UTC';
            const cached = await cacheService.get(cacheKey);
            if (cached && typeof cached === 'object') {
                return { ...cached, ...limits, timezone };
            }

            try {
                const info = await apiService.getUserInfo(login, req.twitchToken || '');
                const [followers, isLive] = await Promise.all([
                    apiService.getFollowersCount(info.id, req.twitchToken || ''),
                    apiService.isStreamLive(info.id, req.twitchToken || '')
                ]);

                const profileResult = buildDashboardProfile(info, followers, isLive, limits);

                await cacheService.set(cacheKey, profileResult, resolveCache('DASHBOARD_PROFILE', apiUser?.role, apiUser?.customCacheTtl));
                return { ...profileResult, ...limits, timezone, cacheTtl: resolveCache('COMMAND', apiUser?.role, apiUser?.customCacheTtl) };
            } catch {
                throw new AppError(MESSAGES.DASHBOARD.USER_INFO_ERROR, 500);
            }
        }
    );

    if (result) return res.json(result);
};

export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await dbService.clearUserStatsAndLogs(userId);
        // Invalidar capas L1 + KV de actividad, analytics y stats de forma explícita
        // para garantizar que el próximo fetch del Dashboard devuelva datos vacíos.
        await Promise.all([
            invalidateDashboardStatsCaches(userId, req.login),
            invalidateOverlayStateCaches(userId),
            cacheService.del(`cache:activity:${userId}`),
            cacheService.del(`cache:dashboard:analytics:${userId}`),
            cacheService.del(`cache:analytics:${userId}`)
        ]);
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
            hasCustomCacheTtl: limits.hasCustomCacheTtl,
            timezone: res.locals?.apiUser?.timezone || 'UTC'
        };
    };

    if (cachedProfile && (!userId || analyticsCacheHit)) {
        // isLive se busca siempre por su propio caché de 30s — nunca servimos un estado de stream viejo
        const isLive = userId && token
            ? await apiService.isStreamLive(userId, token)
            : (cachedProfile.isLive as boolean | undefined);
        return res.json({
            profile: mergeProfileLimits({ ...cachedProfile, isLive }),
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
                      // followers y isLive en paralelo. isLive usa su propio caché de 30s
                      const [followers, isLive] = await Promise.all([
                          apiService.getFollowersCount(info.id, token || ''),
                          apiService.isStreamLive(info.id, token || '')
                      ]);
                      const limits = resolveUserLimits(res.locals.apiUser);
                      // Guardamos el perfil SIN isLive en caché (tiene su propio ciclo de vida de 30s)
                      const profileData = buildDashboardProfile(info, followers, false, limits);
                      return { profileData, isLive, limits };
                  })()
                : Promise.resolve(null),
            needAnalytics && userId
                ? (async () => {
                      const [stats, dailyStats] = await Promise.all([
                          dbService.getUserStats(userId),
                          dbService.getDailyStats(userId, 7)
                      ]);
                      const payload = buildAnalyticsPayload(stats, statsRev);
                      payload.timeSeries = dailyStats;
                      return payload;
                  })()
                : Promise.resolve(cachedAnalytics ?? null)
        ]);

        if (needProfile && profileKey && profile) {
            // Guardamos sin isLive para que el caché del perfil no congele el estado del stream
            const { isLive: _isLive, ...profileWithoutLive } = profile as { isLive?: boolean } & Record<string, unknown>;
            await cacheService.set(
                profileKey,
                { ...profileWithoutLive, ...profile.limits },
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

        const finalProfile = needProfile && profile
            ? (() => {
                  const p = profile as unknown as { profileData: Record<string, unknown>; isLive: boolean; limits: Record<string, unknown> };
                  return { ...p.profileData, ...p.limits, isLive: p.isLive };
              })()
            : (cachedProfile ? { ...cachedProfile, isLive: userId && token
                  ? await apiService.isStreamLive(userId, token)
                  : cachedProfile.isLive } : null);

        res.json({
            profile: mergeProfileLimits(
                finalProfile && typeof finalProfile === 'object' ? (finalProfile as Record<string, unknown>) : null
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
        logger.error('Error setting export cooldown:', e);
        return jsonError(res, 500, 'Error interno del servidor.');
    }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    const { timezone } = req.body;

    try {
        await dbService.updateUserTimezone(userId, timezone);
        res.json({ success: true });
    } catch (e) {
        logger.error('Error updating settings:', e);
        return jsonError(res, 500, 'Error al actualizar los ajustes del perfil.');
    }
};
