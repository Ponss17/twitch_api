import { Response } from 'express';
import * as authService from '../auth/auth.service';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
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
                // Paralelizamos la obtención de info de Twitch y de nuestra DB
                const [userProfile, dbUser] = await Promise.all([
                    apiService.getUserInfo(validation.login, token),
                    dbService.getUserByLogin(validation.login) // Usamos login para paralelizar antes de tener la ID si es posible, o simplemente la ID
                ]);

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
            } catch (err) {
                logger.error('Error fetching supplementary user info:', err);
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
        // Ejecutamos TODAS las comprobaciones en paralelo para reducir latencia drásticamente
        const [dbResult, redisResult, twitchResult] = await Promise.all([
            // 1. DB Check
            (async () => {
                const start = Date.now();
                try {
                    const { error } = await dbService.supabase
                        .from('users')
                        .select('user_id')
                        .limit(1);
                    return { status: error ? 'offline' : 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })(),
            // 2. Redis Check
            (async () => {
                const start = Date.now();
                try {
                    await cacheService.get('health-ping');
                    return { status: 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })(),
            // 3. Twitch Check (si hay token)
            (async () => {
                if (!token) return { status: 'skipped', latency: 0 };
                const start = Date.now();
                try {
                    const val = await apiService.validateToken(token);
                    return { status: val ? 'online' : 'offline', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })()
        ]);

        const dbStatus = dbResult.status as 'online' | 'offline';
        const redisStatus = redisResult.status as 'online' | 'offline';
        const twitchStatus = twitchResult.status as 'online' | 'offline' | 'skipped';

        const isOperational = dbStatus === 'online' && redisStatus === 'online';

        // --- 4. Métricas de Sistema ---
        const memoryUsage = process.memoryUsage();

        res.status(isOperational ? 200 : 503).json({
            status: isOperational ? 'operational' : dbStatus === 'online' ? 'degraded' : 'down',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.9.4',
            uptime: `${Math.floor(process.uptime())}s`,
            services: {
                database: {
                    status: dbStatus,
                    latency: `${dbResult.latency}ms`,
                    provider: 'Supabase'
                },
                cache: {
                    status: redisStatus,
                    latency: `${redisResult.latency}ms`,
                    provider: 'Vercel KV'
                },
                twitch: {
                    status: twitchStatus,
                    latency: twitchResult.latency ? `${twitchResult.latency}ms` : 'n/a'
                }
            },
            system: {
                memory: {
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
                }
            }
        });
    } catch (e) {
        logger.error('Error in health check:', e);
        res.status(500).json({
            status: 'error',
            message: 'Internal health check failure'
        });
    }
};
