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
    const customTitle = (req.query.q as string) || (req.query.title as string);

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
                await dbService.addUserActivity(userId, {
                    type: 'clip',
                    user: (req.query.user as string) || req.displayName || 'Streamer',
                    detail: `${finalTitle} - ${clipUrl}`
                });
            }

            if (clipUrl) {
                const rawTemplate = safeString(req.query.template);
                if (rawTemplate) {
                    const template = rawTemplate.replace(/[\r\n]/g, '');
                    const safeUrl = sanitizeHtml(clipUrl);
                    const safeChannel = sanitizeHtml(channel);
                    const safeTitle = sanitizeHtml(finalTitle || '');
                    return template
                        .replace('{url}', safeUrl)
                        .replace('{channel}', safeChannel)
                        .replace('{title}', safeTitle);
                }
                return clipUrl;
            }
            return null;
        }
    );

    if (result) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(result);
    }
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = req.query.channel as string;
    const user = req.query.user as string;
    const userId = req.userId;

    const result = await trackRequest(
        userId,
        {
            type: 'followage',
            user: user,
            detail: channel,
            incrementStat: 'followage'
        },
        async () => {
            const cacheKey = ownerScopedCacheKey(
                userId,
                `cache:cmd:followage:v3:channel:${channel}:user:${user}`
            );
            const cached = await cacheService.get<{ text: string; timePhrase: string; followDateMs?: number }>(cacheKey);

            if (cached && typeof cached === 'object') {
                if (cached.followDateMs) {
                    const newTimePhrase = getTimePhraseBetween(new Date(cached.followDateMs));
                    cached.timePhrase = newTimePhrase;
                    cached.text = `${user} ha seguido a ${channel} por ${newTimePhrase}.`;
                }
                const template = safeString(req.query.template);
                if (template && cached.timePhrase) {
                    return template
                        .replace('{time}', cached.timePhrase)
                        .replace('{user}', user)
                        .replace('{channel}', channel);
                }
                return cached.text;
            }

            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    const resApi = await apiService.getFollowAge(channel, user, token);
                    const ttl = resolveCache('COMMAND', res.locals.apiUser?.role);
                    await cacheService.set(cacheKey, resApi, ttl);
                    return resApi;
                },
                'FOLLOWAGE'
            );

            if (apiResult) {
                const rawTemplate = safeString(req.query.template);
                if (rawTemplate) {
                    const template = rawTemplate.replace(/[\r\n]/g, '');
                    return template
                        .replace('{time}', sanitizeHtml(apiResult.timePhrase))
                        .replace('{user}', sanitizeHtml(user))
                        .replace('{channel}', sanitizeHtml(channel));
                }
                return apiResult.text;
            }
            return null;
        }
    );

    if (result) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate');
        return res.send(result);
    }
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
            detail: message,
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
        }
    );

    if (result) return res.json(result);
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const touser = req.query.touser as string;

    const result = await trackRequest(
        req.userId,
        {
            type: 'shoutout',
            user: touser,
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
        }
    );

    if (result) {
        res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate');
        return res.send(result);
    }
};
