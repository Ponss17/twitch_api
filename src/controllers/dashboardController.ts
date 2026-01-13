import { Request, Response } from 'express';
import * as dbService from '../services/dbService';
import * as apiService from '../services/apiService';
import * as cacheService from '../services/cacheService';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

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
        res.status(500).json({ error: 'Error fetching analytics' });
    }
};

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const limit = safeString(req.query.limit);
    const limitNum = parseInt(limit) || 20;
    const token = req.twitchToken;

    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    const cacheKey = `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    try {
        const result = await apiService.getClips(channel, limitNum, token || '');
        await cacheService.set(cacheKey, result, 60);
        return res.json(result);
    } catch (error: any) {
        console.error('Error fetching clips:', error.message);
        return res.status(500).json({ error: 'Error recupando clips' });
    }
};

export const getChatters = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const channel = safeString(req.query.channel);
    const userId = req.userId;

    if (!channel) return res.status(400).send('Falta channel');
    if (!userId) return res.status(401).send('Usuario no encontrado');

    try {
        const chatters = await apiService.getChatters(userId, userId, token || '');
        res.json(chatters);
    } catch (error: any) {
        console.error('Error getting chatters:', error.message);
        res.status(500).json({ error: 'Error recuperando chatters' });
    }
};

export const getUserInfo = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const login = safeString(req.query.login);
    if (!login) return res.status(400).send('Falta login');

    try {
        const info = await apiService.getUserInfo(login, token || '');
        res.json(info);
    } catch (error: any) {
        res.status(500).json({ error: 'Error fetching user info' });
    }
};
