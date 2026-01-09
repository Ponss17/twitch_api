import { Request, Response } from 'express';
import axios from 'axios';
import * as apiService from '../services/apiService';
import * as authService from '../services/authService';
import * as dbService from '../services/dbService';
import * as cacheService from '../services/cacheService';
import { TwitchError } from '../types/twitch';

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export const createClip = async (req: Request, res: Response) => {
    const channel = safeString(req.query.channel);
    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    try {
        const result = await apiService.createClip(channel as string, token);
        dbService.incrementUsage('clip');
        return res.send(result);
    } catch (error: any) {
        if (getHttpStatus(error) === 401 && req.query.apiKey) {
            try {
                const apiKey = req.query.apiKey as string;
                const user = await dbService.getUserByApiKey(apiKey);
                if (user) {
                    const newToken = await authService.refreshUserToken(user.userId);
                    const result = await apiService.createClip(channel as string, newToken);
                    return res.send(result);
                }
            } catch (retryError) { }
        }

        return handleApiError(error, res);
    }
};

export const getClips = async (req: Request, res: Response) => {
    const channel = safeString(req.query.channel);
    const limit = safeString(req.query.limit);
    const limitNum = parseInt(limit) || 5;

    if (!channel) return res.status(400).json({ error: 'Falta channel' });

    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).json({ error: 'Token no requerido' });

    const cacheKey = `cmd:getClips:channel:${channel}:limit:${limitNum}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    try {
        const clips = await apiService.getClips(channel, limitNum, token);
        await cacheService.set(cacheKey, clips, 60);
        res.json(clips);
    } catch (error: any) {
        if (getHttpStatus(error) === 401 && req.query.apiKey) {
            try {
                const apiKey = safeString(req.query.apiKey);
                const user = await dbService.getUserByApiKey(apiKey);
                if (user) {
                    const newToken = await authService.refreshUserToken(user.userId);
                    const clips = await apiService.getClips(channel, limitNum, newToken);
                    return res.json(clips);
                }
            } catch (e) { }
        }
        return handleApiError(error, res, true);
    }
};

export const followage = async (req: Request, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    const cacheKey = `cmd:followage:channel:${channel}:user:${user}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.send(cached);

    try {
        const result = await apiService.getFollowAge(channel, user, token);
        await cacheService.set(cacheKey, result, 60);
        dbService.incrementUsage('followage');
        return res.send(result);
    } catch (error: any) {
        if (getHttpStatus(error) === 401 && req.query.apiKey) {
            try {
                const apiKey = safeString(req.query.apiKey);
                const dbUser = await dbService.getUserByApiKey(apiKey);
                if (dbUser) {
                    const newToken = await authService.refreshUserToken(dbUser.userId);
                    const result = await apiService.getFollowAge(channel, user, newToken);
                    return res.send(result);
                }
            } catch (e) { }
        }
        return handleApiError(error, res);
    }
};

function getHttpStatus(error: unknown): number {
    if (axios.isAxiosError(error)) return error.response?.status || 500;
    if (error && typeof error === 'object' && 'status' in error) return (error as any).status;
    return 500;
}

function handleApiError(error: unknown, res: Response, json: boolean = false) {
    let status = getHttpStatus(error);
    let msg = 'Error interno';

    if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || 'Error en comunicación con Twitch';
    } else if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    }

    // Log 500/Internal errors to console for debugging
    if (status >= 500) {
        console.error(`Status ${status} Error:`, msg);
    }

    if (status === 401) {
        msg = '⛔ Error: Credenciales inválidas. Verifica tu API Key.';
        return json ? res.status(401).json({ error: msg }) : res.send(msg);
    }

    if (!json) {
        if (status === 404) return res.send(msg);
        return res.send(`❌ Error: ${msg}`);
    } else {
        return res.status(status).json({ error: msg });
    }
}

export const validateToken = async (req: Request, res: Response) => {
    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    const validation = await apiService.validateToken(token);
    if (validation) {
        try {
            const userProfile = await apiService.getUserInfo(validation.login, token);
            return res.json({
                valid: true,
                user: {
                    id: userProfile.id,
                    login: userProfile.login,
                    display_name: userProfile.display_name,
                    profile_image_url: userProfile.profile_image_url
                }
            });
        } catch (e) {
            return res.json({ valid: true, user: { login: validation.login } });
        }
    } else {
        return res.status(401).send('Token inválido');
    }
};

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = safeString(req.query.apiKey);
    if (!apiKey) return res.status(400).send('API Key requerida');

    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) return res.status(401).send('Usuario no encontrado');

    try {
        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        res.status(500).send('Error regenerando clave');
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const stats = await dbService.getUsageStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching analytics' });
    }
};
