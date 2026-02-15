import { Response } from 'express';
import * as dbService from '../../services/infrastructure/dbService';
import * as apiService from '../../services/twitch/apiService';

import * as cacheService from '../../services/infrastructure/cacheService';
import { MESSAGES } from '../../config/messages';

import { AuthenticatedRequest } from '../../types/twitch';

import { safeString } from '../../utils/validationHelpers';

import { withTwitchAuth } from '../../utils/twitchAuthHelpers';

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const userId = req.userId;

    if (!channel) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    const clipUrl = await withTwitchAuth(
        req,
        res,
        async (token) => {
            const url = await apiService.createClip(channel, token);
            if (userId) {
                await dbService.incrementUserStats(userId, 'clips');
            }
            return url;
        },
        'CREATE_CLIP'
    );

    if (clipUrl) {
        const template = req.query.template as string;
        if (template) {
            const message = template.replace('{url}', clipUrl).replace('{channel}', channel);
            return res.send(message);
        }
        return res.send(clipUrl);
    }
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const user = safeString(req.query.user);
    const userId = req.userId;

    if (!channel || !user) {
        return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);
    }

    // Use v2 cache key to avoid conflicts with old string-only cache
    const cacheKey = `cache:cmd:followage:v2:channel:${channel}:user:${user}`;
    const cached = await cacheService.get(cacheKey);

    if (cached && typeof cached === 'string') {
        // Cached value is expected to be a JSON string of { text, timePhrase }
        try {
            const result = JSON.parse(cached);
            const template = req.query.template as string;
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
            // Fallback if cache is corrupted or in old format (shouldn't happen with v2 key)
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
            }
            return result;
        },
        'FOLLOWAGE'
    );

    if (result) {
        const template = req.query.template as string;
        if (template) {
            const message = template
                .replace('{time}', result.timePhrase)
                .replace('{user}', user)
                .replace('{channel}', channel);
            return res.send(message);
        } else {
            return res.send(result.text);
        }
    }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const message = safeString(req.body.message);
    const userId = req.userId;

    if (!message) return res.status(400).send(MESSAGES.COMMANDS.MISSING_MESSAGE);
    if (message.length > 500) return res.status(400).send(MESSAGES.COMMANDS.MESSAGE_TOO_LONG);
    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);

    const result = await withTwitchAuth(
        req,
        res,
        async (token) => {
            await apiService.sendChatMessage(userId, userId, message, token);
            return { success: true };
        },
        'SEND_MESSAGE'
    );

    if (result) {
        return res.json(result);
    }
};

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const channel = safeString(req.query.channel);
    const touser = safeString(req.query.touser);
    if (!channel || !touser) return res.status(400).send(MESSAGES.COMMANDS.MISSING_PARAMS);

    const result = await withTwitchAuth(
        req,
        res,
        async (token) => {
            const targetUserId = await apiService.getUserId(touser, token);
            const channelInfo = await apiService.getChannelInfo(targetUserId, token);
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
            return message;
        },
        'SHOUTOUT'
    );

    if (result) {
        return res.send(result);
    }
};
