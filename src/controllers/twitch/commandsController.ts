import { Response } from 'express';
import * as dbService from '../../services/infrastructure/dbService';
import * as apiService from '../../services/twitch/apiService';
import * as authService from '../../services/auth/authService';
import * as cacheService from '../../services/infrastructure/cacheService';
import { MESSAGES } from '../../config/messages';

import { AuthenticatedRequest } from '../../types/twitch';

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const token = req.twitchToken;
    const userId = req.userId;

    try {
        const clipUrl = await apiService.createClip(channel, token || '');

        if (userId) {
            await dbService.incrementUserStats(userId, 'clips');
        }

        const template = req.query.template as string;
        if (template) {
            const message = template.replace('{url}', clipUrl).replace('{channel}', channel);
            return res.send(message);
        }

        return res.send(clipUrl);
    } catch (error: unknown) {
        const status = (error as { status?: number }).status || 500;
        const message =
            status === 404
                ? (error as { message?: string }).message
                : MESSAGES.COMMANDS.CREATE_CLIP_ERROR;
        return res.status(status).send(message);
    }
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);
    let token = req.twitchToken;
    const userId = req.userId;
    const apiKey = safeString(req.query.apiKey) || safeString(req.headers['x-api-key']);

    if (!channel || !user) {
        return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);
    }

    const cacheKey = `cache:cmd:followage:channel:${channel}:user:${user}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.send(cached);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const result = await apiService.getFollowAge(channel, user, token || '');
            await cacheService.set(cacheKey, result, 60);

            if (userId) {
                await dbService.incrementUserStats(userId, 'followage');
            }

            const template = req.query.template as string;
            if (template) {
                const message = template
                    .replace('{time}', result)
                    .replace('{user}', user)
                    .replace('{channel}', channel);
                return res.send(message);
            } else {
                return res.send(result);
            }
        } catch (error: unknown) {
            const is401 = error instanceof Error && error.message.includes('401');

            if (is401 && apiKey && attempts < maxAttempts) {
                console.warn(
                    `[FOLLOWAGE] 401 detected (attempt ${attempts}), forcing token refresh...`
                );
                try {
                    const authData = await authService.getValidToken(apiKey);
                    token = authData.accessToken;
                    continue; // Reintentar con el nuevo token
                } catch (refreshErr) {
                    console.error('[FOLLOWAGE] Forced refresh failed:', refreshErr);
                    // Si el refresh falla, salimos del bucle y lanzamos el error original
                }
            }

            // Log detailed error information for debugging
            console.error('[FOLLOWAGE ERROR] Full error details:', {
                channel,
                user,
                attempt: attempts,
                error:
                    error instanceof Error
                        ? {
                              message: error.message,
                              stack: error.stack,
                              name: error.name
                          }
                        : error,
                timestamp: new Date().toISOString()
            });

            // Check if it's a persistent 401 error (expired/invalid token)
            const isTokenError =
                error instanceof Error &&
                (error.message.includes('401') || error.message.includes('token'));

            if (isTokenError) {
                const errorMsg =
                    attempts >= maxAttempts
                        ? 'Tu sesión ha expirado y el refresco automático falló. Por favor, re-autentícate en https://www.losperris.site/api/twitch'
                        : 'Error de autenticación. Inténtalo de nuevo.';
                return res.status(401).send(errorMsg);
            }

            return res.status(500).send(MESSAGES.COMMANDS.FOLLOWAGE_ERROR);
        }
    }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const message = safeString(req.body.message);
    const userId = req.userId;

    if (!message) return res.status(400).send(MESSAGES.COMMANDS.MISSING_MESSAGE);
    if (message.length > 500) return res.status(400).send(MESSAGES.COMMANDS.MESSAGE_TOO_LONG);
    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        await apiService.sendChatMessage(userId, userId, message, token || '');
        res.json({ success: true });
    } catch (_error: unknown) {
        res.status(500).send(MESSAGES.COMMANDS.SEND_MESSAGE_ERROR);
    }
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const touser = safeString(req.query.touser);
    const token = req.twitchToken;

    if (!channel || !touser) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    try {
        const targetUserId = await apiService.getUserId(touser, token || '');
        const channelInfo = await apiService.getChannelInfo(targetUserId, token || '');
        const gameName = channelInfo.game_name || 'Just Chatting';
        const url = `https://twitch.tv/${touser}`;

        const messagePattern =
            (req.query.template as string) || MESSAGES.COMMANDS.SHOUTOUT_HEADLINE;

        const message = messagePattern
            .replace('{user}', touser)
            .replace('{game}', gameName)
            .replace('{url}', url);

        if (req.userId) {
            await dbService.incrementUserStats(req.userId, 'so');
        }

        res.send(message);
    } catch (_error: unknown) {
        res.status(500).send(MESSAGES.COMMANDS.SHOUTOUT_ERROR);
    }
};
