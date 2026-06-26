import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { CACHE_TTL } from '../../core/config/cacheTtl';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { computeAnalyticsFromStats } from '../../core/utils/dashboardHelpers';
import { buildDashboardProfile } from '../../core/utils/dashboardProfile';

import { AuthenticatedRequest } from '../../types/twitch';
import { RATE_LIMITS } from '../../core/config/limits';
import { TwitchApiError } from '../../core/errors/AppError';
import { AppError } from '../../core/errors/AppError';
import { trackRequest } from '../../core/utils/tracking';
import { jsonError } from '../../core/utils/jsonResponse';




export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    }

    try {
        const cacheKey = `cache:analytics:${userId}`;
        const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const stats = await dbService.getUserStats(userId);
        const computed = computeAnalyticsFromStats(stats);
        const payload = {
            ...stats,
            ...computed,
            totalRequests: stats.total_requests || 0
        };

        await cacheService.set(cacheKey, payload, CACHE_TTL.ANALYTICS);
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
        const logs = await dbService.getUserActivity(userId);
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
            const cacheKey = `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) return res.json(cached);

            try {
                const result = await apiService.getClips(channel, limitNum, req.twitchToken || '');
                await cacheService.set(cacheKey, result, CACHE_TTL.CLIPS);
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
            const cacheKey = `cache:cmd:getChatters:channel:${channel}:eligibility:${eligibilityRaw ?? 'all'}`;
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
                await cacheService.set(cacheKey, payload, CACHE_TTL.CHATTERS);
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
            const rateLimit = apiUser?.customRateLimit || RATE_LIMITS.DEFAULT;

            const cacheKey = `cache:cmd:getUserInfo:login:${login}`;
            const cached = await cacheService.get(cacheKey);
            if (cached && typeof cached === 'object') {
                return res.json({ ...cached, rateLimit });
            }

            try {
                const info = await apiService.getUserInfo(login, req.twitchToken || '');
                const followers = await apiService.getFollowersCount(
                    info.id,
                    req.twitchToken || ''
                );

                const result = buildDashboardProfile(
                    info,
                    followers,
                    rateLimit
                );

                await cacheService.set(cacheKey, result, CACHE_TTL.USER_INFO);
                res.json({ ...result, rateLimit });
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
        await cacheService.invalidateDashboardCache(userId, req.login);
        res.json({ success: true, message: 'Estadùsticas y actividad reiniciadas correctamente.' });
    } catch (e) {
        logger.error('Error clearing user data:', e);
        return jsonError(res, 500, MESSAGES.DASHBOARD.ANALYTICS_ERROR);
    }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const login = req.login;
        await dbService.deleteUser(userId);
        if (login) {
            await cacheService.invalidateDashboardCache(userId, login);
        }
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

    const [cachedProfile, cachedAnalytics] = await Promise.all([
        profileKey ? cacheService.get<Record<string, unknown>>(profileKey) : Promise.resolve(null),
        analyticsKey ? cacheService.get<Record<string, unknown>>(analyticsKey) : Promise.resolve(null)
    ]);

    if (cachedProfile && (!userId || cachedAnalytics)) {
        return res.json({
            profile: cachedProfile,
            analytics: cachedAnalytics ?? null
        });
    }

    try {
        const needProfile = !cachedProfile;
        const needAnalytics = Boolean(userId && !cachedAnalytics);

        const [profile, analytics] = await Promise.all([
            needProfile
                ? (async () => {
                      const info = await apiService.getUserInfo(login, token || '');
                      const followers = await apiService.getFollowersCount(info.id, token || '');
                      return {
                          ...buildDashboardProfile(info, followers),
                          rateLimit: res.locals.apiUser?.customRateLimit || RATE_LIMITS.DEFAULT
                      };
                  })()
                : Promise.resolve(cachedProfile),
            needAnalytics && userId
                ? (async () => {
                      const stats = await dbService.getUserStats(userId);
                      return {
                          ...stats,
                          totalRequests: stats.total_requests || 0,
                          ...computeAnalyticsFromStats(stats)
                      };
                  })()
                : Promise.resolve(cachedAnalytics ?? null)
        ]);

        if (needProfile && profileKey && profile) {
            await cacheService.set(profileKey, profile, CACHE_TTL.DASHBOARD_PROFILE);
        }
        if (needAnalytics && analyticsKey && analytics) {
            await cacheService.set(analyticsKey, analytics, CACHE_TTL.DASHBOARD_ANALYTICS);
        }

        res.json({
            profile,
            analytics: analytics ?? null
        });
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        logger.error('Error in getSummary:', error);
        throw new AppError(MESSAGES.DASHBOARD.USER_INFO_ERROR, 500);
    }
};

export const updateTimezone = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { timezone } = req.body;

    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);
    if (!timezone || typeof timezone !== 'string')
        return jsonError(res, 400, 'Timezone invùlida');

    try {
        await dbService.updateUserTimezone(userId, timezone);
        res.json({ success: true, timezone });
    } catch (e) {
        logger.error('Error updating timezone:', e);
        return jsonError(res, 500, 'Error actualizando zona horaria.');
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
        return jsonError(res, 500, 'Error al verificar lùmite de exportaciùn.');
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
        return jsonError(res, 500, 'Error al registrar exportaciùn.');
    }
};
