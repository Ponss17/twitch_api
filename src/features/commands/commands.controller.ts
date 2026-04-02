import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml } from '../../core/utils/validationHelpers';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const userId = req.userId;
    const customTitle = (req.query.q as string) || (req.query.title as string);

    return await trackRequest(
        userId,
        {
            type: 'clip',
            user: req.displayName || 'Streamer',
            detail: customTitle ? `${channel} (${customTitle})` : channel,
            incrementStat: 'clips'
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

                    const url = await apiService.createClip(channel, token);
                    return url;
                },
                'CREATE_CLIP'
            );

            if (clipUrl) {
                const template = safeString(req.query.template);
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                if (template) {
                    const safeUrl = sanitizeHtml(clipUrl);
                    const safeChannel = sanitizeHtml(channel);
                    const safeTitle = sanitizeHtml(finalTitle || '');
                    return res.send(
                        template
                            .replace('{url}', safeUrl)
                            .replace('{channel}', safeChannel)
                            .replace('{title}', safeTitle)
                    );
                }
                return res.send(clipUrl);
            }
        }
    );
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const user = req.query.user as string;
    const userId = req.userId;

    return await trackRequest(
        userId,
        {
            type: 'followage',
            user: user,
            detail: channel,
            incrementStat: 'followage'
        },
        async () => {
            const cacheKey = `cache:cmd:followage:v2:channel:${channel}:user:${user}`;
            const cached = await cacheService.get(cacheKey);

            if (cached && typeof cached === 'string') {
                try {
                    const result = JSON.parse(cached);
                    const template = safeString(req.query.template);
                    if (template && result.timePhrase) {
                        return res.send(
                            template
                                .replace('{time}', result.timePhrase)
                                .replace('{user}', user)
                                .replace('{channel}', channel)
                        );
                    }
                    return res.send(result.text);
                } catch (_e) {
                    cacheService.del(cacheKey);
                }
            }

            const result = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    const resApi = await apiService.getFollowAge(channel, user, token);
                    await cacheService.set(cacheKey, JSON.stringify(resApi), 60);
                    return resApi;
                },
                'FOLLOWAGE'
            );

            if (result) {
                const template = safeString(req.query.template);
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                if (template) {
                    return res.send(
                        template
                            .replace('{time}', sanitizeHtml(result.timePhrase))
                            .replace('{user}', sanitizeHtml(user))
                            .replace('{channel}', sanitizeHtml(channel))
                    );
                }
                return res.send(result.text);
            }
        }
    );
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const message = req.body.message as string;
    const userId = req.userId;

    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    return await trackRequest(
        userId,
        {
            type: 'message',
            user: userId,
            detail: message.substring(0, 30),
            incrementStat: 'message'
        },
        async () => {
            const result = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    await apiService.sendChatMessage(userId, userId, message, token);
                    return { success: true };
                },
                'SEND_MESSAGE'
            );

            if (result) return res.json(result);
        }
    );
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const touser = req.query.touser as string;

    return await trackRequest(
        req.userId,
        {
            type: 'shoutout',
            user: touser,
            incrementStat: 'so'
        },
        async () => {
            const result = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    const targetUserId = await apiService.getUserId(touser, token);
                    const channelInfo = await apiService.getChannelInfo(targetUserId, token);
                    const gameName = channelInfo.game_name || 'Just Chatting';
                    const url = `https://twitch.tv/${touser}`;

                    const messagePattern =
                        safeString(req.query.template) || MESSAGES.COMMANDS.SHOUTOUT_HEADLINE;
                    const message = messagePattern
                        .replace('{user}', touser)
                        .replace('{game}', gameName)
                        .replace('{url}', url);

                    return message;
                },
                'SHOUTOUT'
            );

            if (result) return res.send(result);
        }
    );
};
