import { Response } from 'express';
import * as dbService from '../services/dbService';
import * as apiService from '../services/apiService';
import * as cacheService from '../services/cacheService';
import { MESSAGES } from '../config/messages';

import { AuthenticatedRequest } from '../types/twitch';

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.json({ clips: 0, followage: 0 });
    }

    try {
        const stats = await dbService.getUserStats(userId);
        res.json(stats);
    } catch (e) {
        console.error('Error analytics:', e);
        res.status(500).json({ error: MESSAGES.DASHBOARD.ANALYTICS_ERROR });
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
        const err = error as any;
        console.error('Error fetching clips:', err?.response?.data || err.message);
        const status = err?.response?.status || 500;
        const message = err?.response?.data?.message || MESSAGES.DASHBOARD.CLIPS_ERROR;
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
        const chatters = await apiService.getChatters(userId, userId, token || '');
        res.json(chatters);
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error getting chatters:', err.message);
        res.status(500).json({ error: MESSAGES.DASHBOARD.CHATTERS_ERROR });
    }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const login = safeString(req.query.login);
    if (!login) return res.status(400).send(MESSAGES.COMMANDS.MISSING_LOGIN);

    try {
        const info = await apiService.getUserInfo(login, token || '');
        res.json(info);
    } catch (_error: unknown) {
        res.status(500).json({ error: MESSAGES.DASHBOARD.USER_INFO_ERROR });
    }
};
