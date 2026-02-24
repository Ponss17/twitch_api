import { Response } from 'express';
import * as dbService from '../../services/infrastructure/dbService';
import * as apiService from '../../services/twitch/apiService';
import * as cacheService from '../../services/infrastructure/cacheService';
import { MESSAGES } from '../../config/messages';
import { logger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml } from '../../utils/validationHelpers';
import { withTwitchAuth } from '../../utils/twitchAuthHelpers';

const trackCommand = async <T>(
    userId: string | undefined,
    action: () => Promise<T>
): Promise<T> => {
    const startTime = Date.now();
    try {
        const result = await action();
        const latency = Date.now() - startTime;
        if (userId) {
            // Async fire-and-forget for metrics
            dbService.recordUserRequest(userId, latency, true).catch((e) => {
                logger.error('Error recording success metrics:', e);
            });
        }
        return result;
    } catch (e) {
        const latency = Date.now() - startTime;
        if (userId) {
            dbService.recordUserRequest(userId, latency, false).catch((err) => {
                logger.error('Error recording error metrics:', err);
            });
        }
        throw e;
    }
};

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const userId = req.userId;
    const customTitle = safeString(req.query.q) || safeString(req.query.title);

    if (!channel) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    return await trackCommand(userId, async () => {
        let finalTitle = customTitle;

        const clipUrl = await withTwitchAuth(
            req,
            res,
            async (token) => {
                if (!finalTitle) {
                    try {
                        const broadcasterId = await apiService.getUserId(channel, token);
                        const channelInfo = await apiService.getChannelInfo(broadcasterId, token);
                        finalTitle = channelInfo.title || 'Clip de ' + channel;
                    } catch (error) {
                        logger.warn('Could not fetch stream title for clip fallback:', error);
                        finalTitle = 'Clip de ' + channel;
                    }
                }

                const url = await apiService.createClip(channel, token);
                if (userId) {
                    await dbService.incrementUserStats(userId, 'clips');
                    await dbService.addUserActivity(userId, {
                        type: 'clip',
                        user: req.displayName || 'Streamer',
                        detail: finalTitle ? `${channel} (${finalTitle})` : channel
                    });
                }
                return url;
            },
            'CREATE_CLIP'
        );

        if (clipUrl) {
            const template = safeString(req.query.template);
            if (template) {
                const message = sanitizeHtml(
                    template
                        .replace('{url}', clipUrl)
                        .replace('{channel}', channel)
                        .replace('{title}', finalTitle || '')
                );
                return res.send(message);
            }
            return res.send(clipUrl);
        }
    });
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);
    const userId = req.userId;

    if (!channel || !user) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    return await trackCommand(userId, async () => {
        const cacheKey = `cache:cmd:followage:v2:channel:${channel}:user:${user}`;
        const cached = await cacheService.get(cacheKey);

        if (cached && typeof cached === 'string') {
            try {
                const result = JSON.parse(cached);
                if (userId) {
                    await dbService.addUserActivity(userId, {
                        type: 'followage',
                        user: user,
                        detail: `${channel} (caché)`
                    });
                }
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
            async (token) => {
                const result = await apiService.getFollowAge(channel, user, token);
                await cacheService.set(cacheKey, JSON.stringify(result), 60);

                if (userId) {
                    await dbService.incrementUserStats(userId, 'followage');
                    await dbService.addUserActivity(userId, {
                        type: 'followage',
                        user: user,
                        detail: channel
                    });
                }
                return result;
            },
            'FOLLOWAGE'
        );

        if (result) {
            const template = safeString(req.query.template);
            if (template) {
                return res.send(
                    template
                        .replace('{time}', result.timePhrase)
                        .replace('{user}', user)
                        .replace('{channel}', channel)
                );
            }
            return res.send(result.text);
        }
    });
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const message = safeString(req.body.message);
    const userId = req.userId;

    if (!message) return res.status(400).send(MESSAGES.COMMANDS.MISSING_MESSAGE);
    if (message.length > 500) return res.status(400).send(MESSAGES.COMMANDS.MESSAGE_TOO_LONG);
    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    return await trackCommand(userId, async () => {
        const result = await withTwitchAuth(
            req,
            res,
            async (token) => {
                await apiService.sendChatMessage(userId, userId, message, token);
                await dbService.incrementUserStats(userId, 'message');
                await dbService.addUserActivity(userId, {
                    type: 'message',
                    user: userId,
                    detail: message.substring(0, 30)
                });
                return { success: true };
            },
            'SEND_MESSAGE'
        );

        if (result) return res.json(result);
    });
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const touser = safeString(req.query.touser);
    if (!channel || !touser) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    return await trackCommand(req.userId, async () => {
        const result = await withTwitchAuth(
            req,
            res,
            async (token) => {
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

                if (req.userId) {
                    await dbService.incrementUserStats(req.userId, 'so');
                    await dbService.addUserActivity(req.userId, {
                        type: 'shoutout',
                        user: touser
                    });
                }
                return message;
            },
            'SHOUTOUT'
        );

        if (result) return res.send(result);
    });
};
