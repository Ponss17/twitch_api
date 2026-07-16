import { Response } from 'express';
import * as authService from '../auth/auth.service';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import * as cacheService from '../../core/database/cacheService';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../../core/config/env';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';
import { invalidateAllUserCaches } from '../../core/utils/cacheInvalidation';
import { setSessionCookie } from '../../core/utils/sessionCookie';
import { isAuthenticationError } from '../../core/errors/AppError';
import { invalidateAuthCache } from '../../core/middleware/authMiddleware';

import { AuthenticatedRequest } from '../../types/twitch';

/** Respuesta de validate al panel: sin secretos; renovación usa tokenExpiresAt + cookie. */
function panelValidatePayload(params: {
    userId: string;
    login?: string;
    displayName?: string;
    profileImageUrl?: string;
    timezone?: string;
    tokenExpiresAt?: number | null;
}) {
    return {
        valid: true as const,
        tokenExpiresAt: params.tokenExpiresAt && params.tokenExpiresAt > 0 ? params.tokenExpiresAt : null,
        user: {
            id: params.userId,
            login: params.login,
            display_name: params.displayName || params.login,
            profile_image_url: params.profileImageUrl,
            timezone: params.timezone || 'UTC'
        }
    };
}

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
        let token = req.twitchToken;
        const apiUser = res.locals.apiUser as { apiKey?: string } | undefined;

        // Con API Key: refrescar token antes de validar (el caché puede tener accessToken caducado).
        if (res.locals.isApiKeyRequest && apiUser?.apiKey) {
            try {
                const auth = await authService.getValidToken(apiUser.apiKey);
                token = auth.accessToken;
                req.userId = auth.userId;
                req.twitchToken = token;
            } catch (err) {
                const isAuthError = isAuthenticationError(err);
                
                logger.warn('validateToken: no se pudo obtener token con API Key', (err as Error).message);
                if (isAuthError) {
                    return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
                }
                return jsonError(res, 503, 'Red inestable validando API Key.', {
                    code: 'SERVICE_UNAVAILABLE',
                    details: { offline: true }
                });
            }
        }

        // Si el middleware checkToken ya identificó al usuario (usando caché global), retornar rápido
        if (apiUser && typeof apiUser === 'object' && 'userId' in apiUser) {
            if (res.locals.isOverlayReadRequest) {
                return jsonError(res, 403, 'Los tokens de overlay no pueden validar sesión.', {
                    code: 'OVERLAY_READ_ONLY'
                });
            }

            const user = apiUser as {
                userId: string;
                apiKey?: string;
                login?: string;
                displayName?: string;
                profileImageUrl?: string;
                timezone?: string;
                tokenExpiresAt?: number;
            };
            setSessionCookie(res, user.userId);
            // tokenExpiresAt para useProactiveTokenRefresh (no devolver apiKey/token al panel)
            let tokenExpiresAt =
                user.tokenExpiresAt && user.tokenExpiresAt > 0 ? user.tokenExpiresAt : null;
            if (!tokenExpiresAt) {
                const fresh = await dbService.getUser(user.userId);
                tokenExpiresAt =
                    fresh?.tokenExpiresAt && fresh.tokenExpiresAt > 0 ? fresh.tokenExpiresAt : null;
            }
            return res.json(
                panelValidatePayload({
                    userId: user.userId,
                    login: user.login,
                    displayName: user.displayName,
                    profileImageUrl: user.profileImageUrl,
                    timezone: user.timezone,
                    tokenExpiresAt
                })
            );
        }

        if (!token) {
            return jsonError(res, 401, MESSAGES.AUTH.NO_TOKEN);
        }

        const validation = await apiService.validateToken(token);
        if (!validation) {
            return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
        }

        try {
            const [userProfile, dbUser] = await Promise.all([
                apiService.getUserInfo(validation.login, token),
                dbService.getUser(validation.user_id)
            ]);

            const tokenExpiresAt =
                dbUser?.tokenExpiresAt && dbUser.tokenExpiresAt > 0 ? dbUser.tokenExpiresAt : null;
            if (validation.user_id) {
                setSessionCookie(res, validation.user_id);
            }
            return res.json(
                panelValidatePayload({
                    userId: userProfile.id,
                    login: userProfile.login,
                    displayName: userProfile.display_name,
                    profileImageUrl: userProfile.profile_image_url,
                    timezone: dbUser?.timezone,
                    tokenExpiresAt
                })
            );
        } catch (err) {
            logger.error('Error fetching supplementary user info:', err);
            return res.json({ valid: true, user: { login: validation.login } });
        }
    } catch (error) {
        logger.error('validateToken unexpected error:', error);
        return jsonError(res, 503, MESSAGES.AUTH.VALIDATION_ERROR, {
            code: 'SERVICE_UNAVAILABLE',
            details: { offline: true }
        });
    }
};

export const regenerateKey = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return jsonError(res, 401, MESSAGES.SYSTEM.USER_NOT_FOUND);

    try {
        const apiUser = res.locals?.apiUser as { apiKey?: string } | undefined;
        const oldApiKey = apiUser?.apiKey;
        const newKey = await authService.regenerateApiKey(userId);

        await invalidateAllUserCaches(userId, {
            apiKey: oldApiKey,
            login: req.login,
            revokeApiKey: true
        });
        // Solo limpia caché en memoria; no revocar lp_sess (evita lockout 10 min en el panel).
        invalidateAuthCache(userId, { revokeSession: false });

        await dbService.addAuditLog('api_key_regenerated', userId, userId);

        res.json({ apiKey: newKey });
    } catch (e) {
        logger.error('Error regenerando key:', e);
        return jsonError(res, 500, MESSAGES.SYSTEM.REGENERATE_KEY_ERROR);
    }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
    const { message } = req.body;
    const { userId, login, twitchToken } = req;

    let username = login || MESSAGES.FEEDBACK.ANONYMOUS_USER;
    let avatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
    let userType = MESSAGES.FEEDBACK.VIEWER_ROLE;

    if (userId || login) {
        try {
            let cachedUser = null;
            if (userId) {
                cachedUser = await dbService.getUser(userId);
            }

            if (cachedUser) {
                username = cachedUser.displayName || cachedUser.login;
                avatar = cachedUser.profileImageUrl || avatar;
                if (cachedUser.role) {
                    userType = cachedUser.role.toUpperCase();
                }
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
        return jsonError(res, 500, MESSAGES.SYSTEM.INTERNAL_CONFIG_ERROR, {
            code: 'INTERNAL_ERROR'
        });
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
        return jsonError(res, 500, MESSAGES.FEEDBACK.SEND_ERROR, { code: 'INTERNAL_ERROR' });
    }
};

interface HealthCacheEntry {
    httpStatus: number;
    data: Record<string, unknown>;
}
let cachedHealthResult: HealthCacheEntry | null = null;
let healthCacheExpiry = 0;

export const getHealth = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const now = Date.now();
        // 1. Cache en memoria (warm start): respuesta instantánea
        if (cachedHealthResult && healthCacheExpiry > now) {
            return res.status(cachedHealthResult.httpStatus).json(cachedHealthResult.data);
        }

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
            // 3. Twitch Check (Rápido, sin validar token para no consumir cuota/CPU)
            (async () => {
                const start = Date.now();
                try {
                    await axios.get('https://id.twitch.tv', { timeout: 2000 });
                    return { status: 'online', latency: Date.now() - start };
                } catch {
                    return { status: 'offline', latency: Date.now() - start };
                }
            })()
        ]);

        const dbStatus = dbResult.status as 'online' | 'offline';
        const redisStatus = redisResult.status as 'online' | 'offline';
        const twitchStatus = twitchResult.status as 'online' | 'offline';

        const isOperational = dbStatus === 'online' && redisStatus === 'online';

        // --- 4. Métricas de Sistema ---
        const memoryUsage = process.memoryUsage();

        const httpStatus = isOperational ? 200 : 503;
        const responseData = {
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
                    latency: `${twitchResult.latency}ms`
                }
            },
            system: {
                memory: {
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
                }
            }
        };

        // Guardar en caché en memoria por 60 segundos (sobrevive warm starts)
        cachedHealthResult = { httpStatus, data: responseData };
        healthCacheExpiry = now + 60_000;

        res.status(httpStatus).json(responseData);
    } catch (e) {
        logger.error('Error in health check:', e);
        res.status(500).json({
            status: 'error',
            message: 'Internal health check failure'
        });
    }
};

/**
 * Genera un token JWT firmado para acceso a Supabase Realtime
 * Este token permite al frontend suscribirse a cambios en tiempo real
 * de forma segura, con permisos limitados y tiempo de expiración corto
 */
export const generateRealtimeToken = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const login = req.login;

    if (res.locals.isOverlayReadRequest) {
        return jsonError(res, 403, 'Los tokens de overlay no pueden acceder a Realtime.', {
            code: 'OVERLAY_READ_ONLY'
        });
    }

    if (!userId) {
        return jsonError(res, 401, 'Se requiere autenticación para generar token de realtime', {
            code: 'UNAUTHORIZED'
        });
    }

    try {
        const dbUser = res.locals.apiUser;
        if (!dbUser) {
            return jsonError(res, 401, 'Usuario no autenticado', { code: 'UNAUTHORIZED' });
        }

        // Token JWT con 15 minutos de vida (antes: 5 min).
        // El frontend lo renueva cada 10 min → 60% menos llamadas a este endpoint.
        const TOKEN_TTL_S = 900; // 15 minutos
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: userId,
            user_id: userId,
            login: login || dbUser.login,
            role: 'authenticated',
            aud: 'authenticated',
            iss: 'losperris-api',
            iat: now,
            exp: now + TOKEN_TTL_S
        };

        const token = jwt.sign(payload, CONFIG.SUPABASE_JWT_SECRET, {
            algorithm: 'HS256'
        });

        // Debug: no llenar los logs con una línea por cada renovación periódica
        logger.debug('Realtime token generado', { userId });

        res.json({
            token,
            expiresAt: payload.exp * 1000, // milisegundos para el frontend
            expiresIn: TOKEN_TTL_S
        });
    } catch (error) {
        logger.error('Error generando realtime token:', {
            error: (error as Error).message,
            userId,
            requestId: res.locals.requestId
        });

        return jsonError(res, 500, 'Error al generar el token de acceso', {
            code: 'INTERNAL_ERROR'
        });
    }
};
