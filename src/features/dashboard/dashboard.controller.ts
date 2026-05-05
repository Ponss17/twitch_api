import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { computeAnalyticsFromStats, formatActivityLog } from '../../core/utils/dashboardHelpers';

import { AuthenticatedRequest } from '../../types/twitch';
import { RATE_LIMITS } from '../../core/config/limits';
import { TwitchApiError } from '../../core/errors/AppError';
import { AppError } from '../../core/errors/AppError';
import { trackRequest } from '../../core/utils/tracking';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.json({
            todayRequests: 0,
            totalRequests: 0,
            averageLatency: '0ms (0.0s)',
            avgLatencyMs: 0,
            successRate: '0%',
            rawSuccessRate: 0
        });
    }

    try {
        const stats = await dbService.getUserStats(userId);
        const computed = computeAnalyticsFromStats(stats);

        res.json({
            ...stats,
            ...computed,
            totalRequests: stats.total_requests || 0
        });
    } catch (e) {
        logger.error('Error analytics:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.ANALYTICS_ERROR });
    }
};

export const getLogs = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.json([]);

    try {
        const logs = await dbService.getUserActivity(userId);
        const formattedLogs = logs.map((log: { type: string; user: string; detail?: string }) => ({
            ...log,
            action: formatActivityLog(log)
        }));
        res.json(formattedLogs);
    } catch (e) {
        logger.error('Error logs activity:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.LOGS_ERROR });
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
                await cacheService.set(cacheKey, result, 60);
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
    const userId = req.userId;

    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    return await trackRequest(
        userId,
        {
            type: 'stalker',
            user: channel,
            incrementStat: 'stalker'
        },
        async () => {
            const cacheKey = `cache:cmd:getChatters:channel:${channel}`;
            const cached = await cacheService.get(cacheKey);
            if (cached) return res.json(cached);

            try {
                const broadcasterId = await apiService.getUserId(channel, req.twitchToken || '');
                const chatters = await apiService.getChatters(
                    broadcasterId,
                    userId,
                    req.twitchToken || ''
                );
                await cacheService.set(cacheKey, chatters, 30);
                return res.json(chatters);
            } catch (error: unknown) {
                const err = error as Error;
                logger.error('Error getting chatters:', { error: err.message });
                res.status(500).json({ error: MESSAGES.DASHBOARD.CHATTERS_ERROR });
            }
        }
    );
};

export const trackToolUsage = async (req: AuthenticatedRequest, res: Response) => {
    const { tool } = req.body as { tool: 'trends' | 'stalker' | 'roulette' };
    const userId = req.userId;

    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

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
        res.status(500).json({ error: 'Error tracking usage' });
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

                const result = {
                    id: info.id,
                    login: info.login,
                    display_name: info.display_name,
                    broadcaster_type: info.broadcaster_type,
                    description: info.description,
                    profile_image_url: info.profile_image_url,
                    created_at: info.created_at,
                    view_count: info.view_count,
                    followers,
                    views: info.view_count
                };

                await cacheService.set(cacheKey, result, 3600);
                res.json({ ...result, rateLimit });
            } catch {
                res.status(500).json({ error: MESSAGES.DASHBOARD.USER_INFO_ERROR });
            }
        }
    );
};

export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

    try {
        await dbService.clearUserStatsAndLogs(userId);
        res.json({ success: true, message: 'Estadísticas y actividad reiniciadas correctamente.' });
    } catch (e) {
        logger.error('Error clearing user data:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.ANALYTICS_ERROR });
    }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

    try {
        await dbService.deleteUser(userId);
        res.json({ success: true, message: 'Cuenta eliminada permanentemente del sistema.' });
    } catch (e) {
        logger.error('Error deleting account:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.ANALYTICS_ERROR });
    }
};

export const getSummary = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const login = req.query.login as string;
    const userId = req.userId;

    try {
        const info = await apiService.getUserInfo(login, token || '');

        const [followers, stats] = await Promise.all([
            apiService.getFollowersCount(info.id, token || ''),
            userId ? dbService.getUserStats(userId) : Promise.resolve(null)
        ]);

        const safeInfo = {
            id: info.id,
            login: info.login,
            display_name: info.display_name,
            broadcaster_type: info.broadcaster_type,
            description: info.description,
            profile_image_url: info.profile_image_url,
            created_at: info.created_at
        };

        const analytics = stats
            ? {
                  ...stats,
                  totalRequests: stats.total_requests || 0,
                  ...computeAnalyticsFromStats(stats)
              }
            : null;

        res.json({
            profile: {
                ...safeInfo,
                followers,
                rateLimit: res.locals.apiUser?.customRateLimit || RATE_LIMITS.DEFAULT
            },
            analytics
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

    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });
    if (!timezone || typeof timezone !== 'string')
        return res.status(400).json({ error: 'Timezone inválida' });

    try {
        await dbService.updateUserTimezone(userId, timezone);
        res.json({ success: true, timezone });
    } catch (e) {
        logger.error('Error updating timezone:', e);
        res.status(500).json({ error: 'Error actualizando zona horaria' });
    }
};
