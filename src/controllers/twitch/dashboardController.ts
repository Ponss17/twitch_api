import { Response } from 'express';
import * as dbService from '../../services/infrastructure/dbService';
import * as apiService from '../../services/twitch/apiService';
import * as cacheService from '../../services/infrastructure/cacheService';
import { MESSAGES } from '../../config/messages';
import { logger } from '../../utils/logger';

import { AuthenticatedRequest } from '../../types/twitch';
import { RATE_LIMITS } from '../../config/limits';

import { safeString } from '../../utils/validationHelpers';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.json({
            todayRequests: 0,
            totalRequests: 0,
            averageLatency: '0ms (0.0s)',
            avgLatencyMs: 0,
            successRate: '100%',
            rawSuccessRate: 100
        });
    }

    try {
        const stats = await dbService.getUserStats(userId);
        const today = new Date().toISOString().split('T')[0];

        const todayRequests = parseInt(String(stats[`d:${today}`] || '0'));
        const todayErrors = parseInt(String(stats[`e:${today}`] || '0'));
        const todayLatency = parseInt(String(stats[`l:${today}`] || '0'));

        const hasTodayData = todayRequests > 0;

        // Calcular éxito de hoy
        const todaySuccessRate = hasTodayData
            ? parseFloat(((1 - todayErrors / todayRequests) * 100).toFixed(1))
            : 100;

        // Calcular latencia de hoy
        const todayAvgLatencyMs = hasTodayData ? Math.round(todayLatency / todayRequests) : 0;

        res.json({
            ...stats,
            todayRequests,
            totalRequests: stats.total_requests || 0,
            // Sobrescribimos con los datos de hoy para el Dashboard
            avgLatencyMs: todayAvgLatencyMs,
            rawSuccessRate: todaySuccessRate,
            // Mantenemos los strings formateados por si se usan en algún sitio, pero ahora basados en HOY
            averageLatency: `${todayAvgLatencyMs}ms (${(todayAvgLatencyMs / 1000).toFixed(1)}s)`,
            successRate: `${todaySuccessRate}%`
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
        const formattedLogs = logs.map((log) => {
            let actionText = '';
            switch (log.type) {
                case 'clip':
                    actionText = `📺 Nuevo clip creado por @${log.user} (${log.detail})`;
                    break;
                case 'followage':
                    actionText = `⏱️ @${log.user} revisó su followage en ${log.detail}`;
                    break;
                case 'shoutout':
                    actionText = `🗣️ Shoutout de @${log.user}`;
                    break;
                case 'message':
                    actionText = `💬 Mensaje enviado: "${log.detail}"`;
                    break;
                case 'russian':
                    actionText = `🔫 @${log.user} jugó la Ruleta Rusa`;
                    break;
                case 'magic8':
                    actionText = `🎱 @${log.user} preguntó a la Bola 8`;
                    break;
                case 'duel':
                    actionText = `⚔️ @${log.user} inició un duelo con @${log.detail}`;
                    break;
                default:
                    actionText = `🔹 Actividad: ${log.type} por @${log.user}`;
            }
            return {
                ...log,
                action: actionText
            };
        });
        res.json(formattedLogs);
    } catch (e) {
        logger.error('Error logs activity:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.LOGS_ERROR });
    }
};

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const limit = safeString(req.query.limit);
    let limitNum = parseInt(limit) || 20;
    if (limitNum > 100) limitNum = 100;
    const token = req.twitchToken;

    if (!channel) return res.status(400).send(MESSAGES.COMMANDS.MISSING_CHANNEL);

    const cacheKey = `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    try {
        const result = await apiService.getClips(channel, limitNum, token || '');
        await cacheService.set(cacheKey, result, 60);
        return res.json(result);
    } catch (error: unknown) {
        logger.error('Error fetching clips:', { error });
        const err = error as {
            status?: number;
            response?: { status?: number; data?: { message?: string } };
            message?: string;
        };
        const status = err.status || err.response?.status || 500;
        const message =
            err.message || err.response?.data?.message || MESSAGES.DASHBOARD.CLIPS_ERROR;
        return res.status(status).json({ error: message });
    }
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const channel = safeString(req.query.channel);
    const userId = req.userId;

    if (!channel) return res.status(400).send(MESSAGES.COMMANDS.MISSING_CHANNEL);
    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const broadcasterId = await apiService.getUserId(channel, token || '');
        const chatters = await apiService.getChatters(broadcasterId, userId, token || '');
        res.json(chatters);
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Error getting chatters:', { error: err.message });
        res.status(500).json({ error: MESSAGES.DASHBOARD.CHATTERS_ERROR });
    }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const login = safeString(req.query.login);
    if (!login) return res.status(400).send(MESSAGES.COMMANDS.MISSING_LOGIN);

    try {
        const info = await apiService.getUserInfo(login, token || '');
        const followers = await apiService.getFollowersCount(info.id, token || '');

        const apiUser = res.locals.apiUser;
        const rateLimit = apiUser?.customRateLimit || RATE_LIMITS.DEFAULT;

        res.json({
            ...info,
            followers,
            views: info.view_count,
            rateLimit
        });
    } catch (_error: unknown) {
        res.status(500).json({ error: MESSAGES.DASHBOARD.USER_INFO_ERROR });
    }
};
export const clearUserData = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { confirm } = req.body;

    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });
    if (confirm !== 'LIMPIAR') {
        return res
            .status(400)
            .json({ error: 'Debes escribir LIMPIAR para confirmar esta acción.' });
    }

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
    const { confirm } = req.body;

    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });
    if (confirm !== 'ELIMINAR') {
        return res
            .status(400)
            .json({ error: 'Debes escribir ELIMINAR para confirmar esta acción.' });
    }

    try {
        await dbService.deleteUser(userId);
        res.json({ success: true, message: 'Cuenta eliminada permanentemente del sistema.' });
    } catch (e) {
        logger.error('Error deleting account:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.ANALYTICS_ERROR });
    }
};
