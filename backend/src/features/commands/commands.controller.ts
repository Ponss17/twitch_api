import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { ownerScopedCacheKey, resolveCache } from '../../core/config/cacheTtl';

import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml } from '../../core/utils/validationHelpers';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { getTimePhraseBetween } from '../../core/utils/time';
import * as dbService from '../../core/database/dbService';

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const userId = req.userId;
    let customTitle = (req.query.q as string) || (req.query.title as string);
    if (
        customTitle === '[invalid variable]' ||
        customTitle === 'null' ||
        customTitle === 'undefined' ||
        customTitle?.includes('$(') ||
        customTitle?.includes('${')
    ) {
        customTitle = '';
    }

    const result = await trackRequest(
        userId,
        {
            type: 'clip',
            user: (req.query.user as string) || req.displayName || 'Streamer',
            incrementStat: 'clips',
            skipActivityLog: true
        },
        async () => {
            let finalTitle = customTitle;

            const clipUrl = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    if (!finalTitle) {
                        try {
                            const broadcasterId = await apiService.getUserId(channel, token);
                            const channelInfo = await apiService.getChannelInfo(
                                broadcasterId,
                                token
                            );
                            finalTitle = channelInfo.title || 'Clip de ' + channel;
                        } catch (error) {
                            logger.warn('Could not fetch stream title for clip fallback:', error);
                            finalTitle = 'Clip de ' + channel;
                        }
                    }

                    return await apiService.createClip(channel, token, finalTitle);
                },
                'create-clip'
            );

            if (userId) {
                let chatter = (req.query.user as string) || req.displayName || 'Streamer';
                if (chatter.includes('$(') || chatter.includes('${')) chatter = 'Anónimo';
                await dbService.addUserActivity(userId, {
                    type: 'clip',
                    user: chatter,
                    metadata: { title: finalTitle, url: clipUrl }
                });
            }

            if (clipUrl) {
                const rawTemplate = safeString(req.query.template);
                if (rawTemplate) {
                    const template = rawTemplate.replace(/[\r\n]/g, '');
                    const safeUrl = sanitizeHtml(clipUrl);
                    const safeChannel = sanitizeHtml(channel);
                    const safeTitle = sanitizeHtml(finalTitle || '');
                    let safeUser = (req.query.user as string) || req.displayName || 'Streamer';
                    if (safeUser.includes('$(') || safeUser.includes('${')) safeUser = 'Anónimo';
                    safeUser = sanitizeHtml(safeUser);
                    return template
                        .replace('{user}', safeUser)
                        .replace('{url}', safeUrl)
                        .replace('{channel}', safeChannel)
                        .replace('{title}', safeTitle);
                }
                return clipUrl;
            }
            return null;
        },
        req
    );

    if (result) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(result);
    }
    if (!res.headersSent) return res.status(204).send();
};

function followagePlainText(result: unknown): string {
    if (typeof result === 'string' && result.trim()) return result.trim();
    if (result && typeof result === 'object' && !Array.isArray(result)) {
        const text = (result as { text?: unknown }).text;
        if (typeof text === 'string' && text.trim()) return text.trim();
    }
    return 'No se pudo obtener el followage. Intenta de nuevo en unos segundos.';
}

function applyFollowageTemplate(
    templateRaw: string,
    timePhrase: string,
    user: string,
    channel: string
): string {
    const template = templateRaw.replace(/[\r\n]/g, '');
    return template
        .replace('{time}', timePhrase)
        .replace('{user}', user)
        .replace('{channel}', channel);
}

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const user = req.query.user as string;
    const userId = req.userId;

    let sanitizedUser = user;
    if (sanitizedUser?.includes('$(') || sanitizedUser?.includes('${')) sanitizedUser = 'Anónimo';

    const result = await trackRequest(
        userId,
        {
            type: 'followage',
            user: sanitizedUser,
            metadata: { target: channel },
            incrementStat: 'followage'
        },
        async () => {
            // Helix: broadcaster o moderador del canal (scope moderator:read:followers).
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:followage:v6:channel:${channel}:user:${user}`
            );
            const cached = await cacheService.get<{ text: string; timePhrase: string; followDateMs?: number }>(cacheKey);

            if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
                const entry = { ...cached };
                if (entry.followDateMs) {
                    const newTimePhrase = getTimePhraseBetween(new Date(entry.followDateMs));
                    entry.timePhrase = newTimePhrase;
                    entry.text = `${user} ha seguido a ${channel} por ${newTimePhrase}.`;
                }
                const template = safeString(req.query.template);
                if (template && entry.timePhrase && entry.timePhrase !== 'error') {
                    return applyFollowageTemplate(template, entry.timePhrase, user, channel);
                }
                if (typeof entry.text === 'string' && entry.text.trim() && entry.timePhrase !== 'error') {
                    return entry.text;
                }
            }

            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => apiService.getFollowAge(channel, user, token),
                'FOLLOWAGE'
            );

            if (!apiResult || typeof apiResult.text !== 'string' || !apiResult.text.trim()) {
                logger.error('Followage sin texto usable', {
                    channel,
                    user,
                    hasToken: Boolean(req.twitchToken),
                    apiResult
                });
                return 'No se pudo obtener el followage. Vuelve a iniciar sesión en el panel e intenta de nuevo.';
            }

            // Solo cachear follows reales (con fecha). "no sigue" / errores no se cachean.
            if (apiResult.timePhrase !== 'error' && apiResult.timePhrase !== 'no sigue') {
                const ttl = resolveCache(
                    'COMMAND',
                    res.locals?.apiUser?.role,
                    res.locals?.apiUser?.customCacheTtl
                );
                await cacheService.set(cacheKey, apiResult, ttl);
            }

            const rawTemplate = safeString(req.query.template);
            if (rawTemplate && apiResult.timePhrase && apiResult.timePhrase !== 'error') {
                return applyFollowageTemplate(
                    rawTemplate,
                    sanitizeHtml(apiResult.timePhrase),
                    sanitizeHtml(user),
                    sanitizeHtml(channel)
                );
            }
            return apiResult.text.trim();
        },
        req
    );

    const body =
        typeof result === 'string' && result.trim()
            ? result.trim()
            : followagePlainText(result);
    logger.warn('Followage respuesta', {
        channel,
        user,
        bodyPreview: body.slice(0, 180)
    });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    // Respuesta personalizada (apiKey): nunca cachear en CDN.
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    return res.send(body);
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const message = req.body.message as string;
    const userId = req.userId;

    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    const actorLogin =
        req.login ||
        req.displayName ||
        res.locals.apiUser?.login ||
        res.locals.apiUser?.displayName ||
        'Canal';

    const result = await trackRequest(
        userId,
        {
            type: 'message',
            user: actorLogin,
            metadata: { message: message },
            incrementStat: 'message'
        },
        async () => {
            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    await apiService.sendChatMessage(userId, userId, message, token);
                    return { success: true };
                },
                'SEND_MESSAGE'
            );

            return apiResult;
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) return res.status(204).send();
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const touser = req.query.touser as string;
    let sanitizedUser = req.query.user as string;
    if (sanitizedUser?.includes('$(') || sanitizedUser?.includes('${')) sanitizedUser = 'Anónimo';

    const result = await trackRequest(
        req.userId,
        {
            type: 'shoutout',
            user: sanitizedUser || 'Anónimo',
            metadata: { target: touser },
            incrementStat: 'so'
        },
        async () => {
            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    const targetUserId = await apiService.getUserId(touser, token);
                    const channelInfo = await apiService.getChannelInfo(targetUserId, token);
                    const gameName = channelInfo.game_name || 'Just Chatting';
                    const url = `https://twitch.tv/${touser}`;

                    const rawPattern =
                        safeString(req.query.template) || MESSAGES.COMMANDS.SHOUTOUT_HEADLINE;
                    const messagePattern = rawPattern.replace(/[\r\n]/g, '');
                    const message = messagePattern
                        .replace('{user}', touser)
                        .replace('{game}', gameName)
                        .replace('{url}', url);

                    return message;
                },
                'SHOUTOUT'
            );

            return apiResult;
        },
        req
    );

    if (result) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        return res.send(result);
    }
    if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        return res.send('No se pudo generar el shoutout. Intenta de nuevo.');
    }
};
