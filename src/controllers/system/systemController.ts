import { Request, Response } from 'express';
import * as authService from '../../services/auth/authService';
import * as dbService from '../../services/infrastructure/dbService';
import * as apiService from '../../services/twitch/apiService';
import axios from 'axios';
import { CONFIG } from '../../config/env';
import { MESSAGES } from '../../config/messages';
import { logger } from '../../utils/logger';

import { AuthenticatedRequest } from '../../types/twitch';

import { safeString } from '../../utils/validationHelpers';

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    if (!token) return res.status(401).send(MESSAGES.AUTH.NO_TOKEN);

    try {
        const validation = await apiService.validateToken(token);
        if (validation) {
            try {
                const userProfile = await apiService.getUserInfo(validation.login, token);
                const dbUser = await dbService.getUser(userProfile.id);

                return res.json({
                    valid: true,
                    token: token,
                    apiKey: dbUser?.apiKey || null,
                    user: {
                        id: userProfile.id,
                        login: userProfile.login,
                        display_name: userProfile.display_name,
                        profile_image_url: userProfile.profile_image_url
                    }
                });
            } catch (_e) {
                return res.json({ valid: true, token: token, user: { login: validation.login } });
            }
        } else {
            return res.status(401).send(MESSAGES.AUTH.INVALID_TOKEN);
        }
    } catch (_error: unknown) {
        return res.status(500).json({ error: MESSAGES.AUTH.VALIDATION_ERROR });
    }
};

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = safeString(req.body.key);
    if (!apiKey) return res.status(400).json({ error: MESSAGES.SYSTEM.KEY_REQUIRED });

    try {
        const user = await dbService.getUserByApiKey(apiKey);
        if (!user) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        logger.error('Error regenerando key:', e);
        res.status(500).json({ error: MESSAGES.SYSTEM.REGENERATE_KEY_ERROR });
    }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
    const { message } = req.body;
    const { userId, login, twitchToken } = req;

    let username = login || MESSAGES.FEEDBACK.ANONYMOUS_USER;
    let avatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
    const userType = MESSAGES.FEEDBACK.VIEWER_ROLE;

    if (userId || login) {
        try {
            let cachedUser = null;
            if (userId) {
                cachedUser = await dbService.getUser(userId);
            }

            if (cachedUser) {
                username = cachedUser.displayName || cachedUser.login;
                avatar = cachedUser.profileImageUrl || avatar;
            } else if (twitchToken && login) {
                const liveInfo = await apiService.getUserInfo(login, twitchToken);
                if (liveInfo) {
                    username = liveInfo.display_name;
                    avatar = liveInfo.profile_image_url;
                }
            }
        } catch (e) {
            logger.error('Error identifying user for feedback:', e);
        }
    }

    if (!message) {
        return res.status(400).json({ error: MESSAGES.FEEDBACK.MESSAGE_REQUIRED });
    }

    if (message.length > 2000) {
        return res.status(400).json({ error: MESSAGES.FEEDBACK.MESSAGE_TOO_LONG });
    }

    if (!CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL) {
        return res.status(500).json({ error: MESSAGES.SYSTEM.INTERNAL_CONFIG_ERROR });
    }

    try {
        await axios.post(CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL, {
            username: username,
            avatar_url: avatar,
            embeds: [
                {
                    title: MESSAGES.FEEDBACK.EMBED_TITLE,
                    color: 0x9146ff,
                    fields: [
                        {
                            name: '🆔 Usuario ID',
                            value: userId || login || 'Anónimo',
                            inline: true
                        },
                        { name: '🏷️ Rango', value: userType, inline: true },
                        { name: '📝 Mensaje', value: message, inline: false }
                    ],
                    footer: { text: MESSAGES.FEEDBACK.EMBED_FOOTER },
                    timestamp: new Date().toISOString()
                }
            ]
        });

        res.json({ success: true, message: MESSAGES.FEEDBACK.SUCCESS });
    } catch (error) {
        logger.error('Error enviando feedback a Discord:', error);
        res.status(500).json({ error: MESSAGES.FEEDBACK.SEND_ERROR });
    }
};

export const getHealth = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    const startTime = Date.now();

    try {
        const dbStatus = await dbService
            .getUser('ping')
            .then(() => 'online')
            .catch(() => 'offline');

        let twitchStatus = 'offline';
        if (token) {
            try {
                const validation = await apiService.validateToken(token);
                if (validation) twitchStatus = 'online';
            } catch (_e) {
                twitchStatus = 'error';
            }
        }

        const latency = Date.now() - startTime;

        res.json({
            status: dbStatus === 'online' && twitchStatus === 'online' ? 'operational' : 'degraded',
            checks: {
                database: dbStatus,
                twitch: twitchStatus
            },
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        logger.error('Error in health check:', e);
        res.status(500).json({ status: 'down', error: 'Internal health check failed' });
    }
};
