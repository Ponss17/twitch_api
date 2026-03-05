import { Response } from 'express';
import * as authService from '../auth/auth.service';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import { kv } from '@vercel/kv';
import axios from 'axios';
import { CONFIG } from '../../core/config/env';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';

import { AuthenticatedRequest } from '../../types/twitch';

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
                    apiKey: dbUser?.apiKey || null,
                    user: {
                        id: userProfile.id,
                        login: userProfile.login,
                        display_name: userProfile.display_name,
                        profile_image_url: userProfile.profile_image_url
                    }
                });
            } catch (_e) {
                return res.json({ valid: true, user: { login: validation.login } });
            }
        } else {
            return res.status(401).send(MESSAGES.AUTH.INVALID_TOKEN);
        }
    } catch (_error: unknown) {
        return res.status(500).json({ error: MESSAGES.AUTH.VALIDATION_ERROR });
    }
};

export const regenerateKey = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

    try {
        const newKey = await authService.regenerateApiKey(userId);

        await dbService.addAuditLog('api_key_regenerated', userId, userId);

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

    try {
        const dbStart = Date.now();
        let dbStatus: 'online' | 'offline';
        try {
            await kv.ping();
            dbStatus = 'online';
        } catch (_e) {
            dbStatus = 'offline';
        }
        const dbLatency = Date.now() - dbStart;

        let twitchStatus: 'online' | 'offline' | 'skipped' = 'skipped';
        let twitchLatency = 0;
        if (token) {
            const twitchStart = Date.now();
            try {
                const validation = await apiService.validateToken(token);
                twitchStatus = validation ? 'online' : 'offline';
            } catch (_e) {
                twitchStatus = 'offline';
            }
            twitchLatency = Date.now() - twitchStart;
        }

        const isOperational = dbStatus === 'online';

        res.status(isOperational ? 200 : 503).json({
            status: isOperational ? 'operational' : 'degraded',
            checks: {
                redis: { status: dbStatus, latency: `${dbLatency}ms` },
                twitch: {
                    status: twitchStatus,
                    latency: twitchLatency ? `${twitchLatency}ms` : 'n/a'
                }
            },
            uptime: `${Math.floor(process.uptime())}s`,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        logger.error('Error in health check:', e);
        res.status(500).json({ status: 'down', error: 'Internal health check failed' });
    }
};
