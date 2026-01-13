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

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const token = req.twitchToken;
    const userId = req.userId;

    if (!channel) return res.status(400).send('Falta channel');

    try {
        const result = await apiService.createClip(channel, token || '');

        if (userId) {
            await dbService.incrementUserStats(userId, 'clip');
        }

        return res.send(result);
    } catch (error: any) {
        return res.status(500).send('Error creando clip');
    }
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);
    const token = req.twitchToken;
    const userId = req.userId;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    const cacheKey = `cache:cmd:followage:channel:${channel}:user:${user}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.send(cached);

    try {
        const result = await apiService.getFollowAge(channel, user, token || '');
        await cacheService.set(cacheKey, result, 60);

        if (userId) {
            await dbService.incrementUserStats(userId, 'followage');
        }

        res.send(result);
    } catch (error: any) {
        res.status(500).send('Error verificando seguimiento.');
    }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const message = safeString(req.body.message);
    const userId = req.userId;

    if (!message) return res.status(400).send('Falta mensaje');
    if (!userId) return res.status(401).send('Usuario no encontrado');

    try {
        await apiService.sendChatMessage(userId, userId, message, token || '');
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Error enviando mensaje' });
    }
};
