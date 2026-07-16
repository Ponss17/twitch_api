import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import * as apiService from '../twitch/twitch.service';
import { resolveCache } from '../../core/config/cacheTtl';
import { resolveUserLimits } from '../../core/config/userRoles';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { buildAnalyticsPayload, isAnalyticsCacheFresh } from './dashboardHelpers';
import { buildDashboardProfile } from '../../core/utils/dashboardProfile';
import { AuthenticatedRequest } from '../../types/twitch';
import { TwitchApiError, AppError } from '../../core/errors/AppError';
import { jsonError } from '../../core/utils/jsonResponse';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const cacheKey = `cache:dashboard:analytics:${userId}`;
        const statsRev = await cacheService.getStatsRevision(userId);
        const cached = await cacheService.get<Record<string, unknown>>(cacheKey);
        if (cached && isAnalyticsCacheFresh(cached, statsRev)) return res.json(cached);

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
        if (cached) return res.json(cached);

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

    const analyticsCacheHit = Boolean(cachedAnalytics) && isAnalyticsCacheFresh(cachedAnalytics, statsRev);
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
        const isLive = userId && token
            ? await apiService.isStreamLive(userId, token)
            : (cachedProfile.isLive as boolean | undefined);
        return res.json({ profile: mergeProfileLimits({ ...cachedProfile, isLive }), analytics: cachedAnalytics ?? null });
    }

    try {
        const needProfile = !cachedProfile;
        const needAnalytics = Boolean(userId && !analyticsCacheHit);

        const [profile, analytics] = await Promise.all([
            needProfile
                ? withTwitchAuth(req, res, async (token) => {
                      const info = await apiService.getUserInfo(login, token);
                      const [followers, isLive] = await Promise.all([
                          apiService.getFollowersCount(info.id, token),
                          apiService.isStreamLive(info.id, token)
                      ]);
                      const limits = resolveUserLimits(res.locals.apiUser);
                      const profileData = buildDashboardProfile(info, followers, false, limits);
                      return { profileData, isLive, limits };
                  }, 'getSummary')
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
            profile: mergeProfileLimits(finalProfile && typeof finalProfile === 'object' ? (finalProfile as Record<string, unknown>) : null),
            analytics: analytics ?? null
        });
    } catch (error) {
        if (error instanceof TwitchApiError && error.statusCode === 401 && (cachedProfile || cachedAnalytics)) {
            return res.json({ profile: mergeProfileLimits(cachedProfile ? { ...cachedProfile } : null), analytics: cachedAnalytics ?? null });
        }
        if (error instanceof AppError && error.statusCode === 401 && (cachedProfile || cachedAnalytics)) {
            return res.json({ profile: mergeProfileLimits(cachedProfile ? { ...cachedProfile } : null), analytics: cachedAnalytics ?? null });
        }
        if (error instanceof TwitchApiError) throw error;
        if (error instanceof AppError) throw error;
        logger.error('Error in getSummary:', error);
        throw new AppError(MESSAGES.DASHBOARD.USER_INFO_ERROR, 500);
    }
};