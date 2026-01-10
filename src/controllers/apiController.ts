import { Request, Response } from 'express';
import axios from 'axios';
import * as apiService from '../services/apiService';
import * as authService from '../services/authService';
import * as dbService from '../services/dbService';
import * as cacheService from '../services/cacheService';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

const getUserId = async (req: Request): Promise<string | null> => {
    const apiKey = safeString(req.query.apiKey);
    if (apiKey) {
        const user = await dbService.getUserByApiKey(apiKey);
        return user ? user.userId : null;
    }
    return null;
};

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const limit = safeString(req.query.limit);
    const limitNum = parseInt(limit) || 1;

    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    const cacheKey = `cache:cmd:getClips:channel:${channel}:limit:${limitNum}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    try {
        const result = await apiService.getClips(channel, limitNum, token);
        await cacheService.set(cacheKey, result, 60);

        const userId = await getUserId(req);
        if (userId) {
            await dbService.incrementUserStats(userId, 'clip');
        }

        return res.json(result);
    } catch (error: any) {
        if (getHttpStatus(error) === 401 && req.query.apiKey) {
            try {
                const apiKey = safeString(req.query.apiKey);
                const user = await dbService.getUserByApiKey(apiKey);
                if (user) {
                    const newToken = await authService.refreshUserToken(user.userId);
                    const result = await apiService.getClips(channel, limitNum, newToken);

                    // Update cache with new result
                    await cacheService.set(cacheKey, result, 60);

                    return res.json(result);
                }
            } catch (retryError) { }
        }
        return handleApiError(error, res, true);
    }
};

export const getClips = createClip;

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    const cacheKey = `cache:cmd:followage:channel:${channel}:user:${user}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.send(cached);

    try {
        const result = await apiService.getFollowAge(channel, user, token);
        await cacheService.set(cacheKey, result, 60);

        const userId = await getUserId(req);
        if (userId) {
            await dbService.incrementUserStats(userId, 'followage');
        }

        return res.send(result);
    } catch (error: any) {
        if (getHttpStatus(error) === 401 && req.query.apiKey) {
            try {
                const apiKey = safeString(req.query.apiKey);
                const dbUser = await dbService.getUserByApiKey(apiKey);
                if (dbUser) {
                    const newToken = await authService.refreshUserToken(dbUser.userId);
                    const result = await apiService.getFollowAge(channel, user, newToken);

                    await cacheService.set(cacheKey, result, 60);

                    return res.send(result);
                }
            } catch (e) { }
        }
        return handleApiError(error, res);
    }
};

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken || safeString(req.query.token);
    if (!token) return res.status(401).send('Token no proporcionado.');

    try {
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
    } catch (error) {
        return handleApiError(error, res, true);
    }
};

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = safeString(req.body.key);
    if (!apiKey) return res.status(400).json({ error: 'Key requerida' });

    try {
        const user = await dbService.getUserByApiKey(apiKey);
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        console.error('Error regenerando key:', e);
        res.status(500).json({ error: 'Error regenerando clave' });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    const userId = await getUserId(req);

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

function getHttpStatus(error: unknown): number {
    if (axios.isAxiosError(error)) return error.response?.status || 500;
    if (error && typeof error === 'object' && 'status' in error) return (error as any).status;
    return 500;
}

function handleApiError(error: unknown, res: Response, json: boolean = false) {
    let status = getHttpStatus(error);
    let msg = 'Error interno';

    if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message || error.message || 'Error en comunicación con Twitch';
    } else if (error instanceof Error) {
        msg = error.message;
    } else if (typeof error === 'string') {
        msg = error;
    }

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
