import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, StoredUser } from '../../types/twitch';
import * as apiService from '../../features/twitch/twitch.service';
import * as dbService from '../database/dbService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';
import { isPublicRoute } from '../utils/routeHelpers';

const userCache = new Map<string, { user: StoredUser; expiry: number }>();
const invalidTokensCache = new Map<string, number>(); // Cache negativa: token -> timestamp expiración
const CACHE_TTL = 60 * 1000;
const NEGATIVE_CACHE_TTL = 30 * 1000;

// Throttle updateLastActive to once per 5 minutes per user
const lastActiveThrottle = new Map<string, number>();
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;
const pendingUserDbRequests = new Map<string, Promise<StoredUser | null>>();

const setInvalidToken = (token: string, expiry: number) => {
    if (invalidTokensCache.size >= MAX_CACHE_SIZE) {
        const iterator = invalidTokensCache.keys();
        for (let i = 0; i < 250; i++) {
            const val = iterator.next().value;
            if (val) invalidTokensCache.delete(val);
        }
    }
    invalidTokensCache.set(token, expiry);
};

const throttledUpdateLastActive = (userId: string) => {
    const now = Date.now();
    const lastUpdate = lastActiveThrottle.get(userId) || 0;
    if (now - lastUpdate < LAST_ACTIVE_THROTTLE_MS) return;

    if (lastActiveThrottle.size >= MAX_CACHE_SIZE) {
        const iterator = lastActiveThrottle.keys();
        for (let i = 0; i < 250; i++) {
            const val = iterator.next().value;
            if (val) lastActiveThrottle.delete(val);
        }
    }
    lastActiveThrottle.set(userId, now);
    dbService.updateLastActive(userId).catch((err) => {
        logger.error('Error updating last active:', err);
    });
};

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const safeString = (val: unknown) => (typeof val === 'string' ? val : '');

    if (res.locals.apiUser) {
        const user = res.locals.apiUser;
        req.userId = user.userId;
        req.login = user.login;
        req.displayName = user.displayName;
        req.twitchToken = user.accessToken;

        // No esperamos a que termine para no bloquear el hilo de ejecución
        throttledUpdateLastActive(user.userId);
        return next();
    }

    let token = safeString(req.query.token) || safeString(req.body?.token);

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        // 1. Saltarse validación para archivos estáticos y rutas públicas configuradas
        if (isPublicRoute(req.path, req.method)) {
            return next();
        }

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
        }
        return res.status(401).json({ error: MESSAGES.AUTH.MISSING_TOKEN_URL });
    }

    const now = Date.now();

    if (token && invalidTokensCache.has(token)) {
        if (now < invalidTokensCache.get(token)!) {
            return res.status(401).json({ error: MESSAGES.AUTH.INVALID_TOKEN });
        }
        invalidTokensCache.delete(token);
    }

    if (!req.userId || !req.login) {
        try {
            const validation = await apiService.validateToken(token);
            if (validation) {
                if (validation.user_id) req.userId = validation.user_id;
                if (validation.login) req.login = validation.login;
            } else {
                // Token inválido: meter en caché negativa
                setInvalidToken(token, now + NEGATIVE_CACHE_TTL);
                return res.status(401).json({ error: MESSAGES.AUTH.INVALID_TOKEN });
            }
        } catch (_e) {
            // Guardamos en caché negativa incluso en error para evitar reintento inmediato
            setInvalidToken(token, now + NEGATIVE_CACHE_TTL);
            logger.warn('Error Middleware Auth: Could not validate token to extract user data');
        }
    }

    // Unificación de Rate Limit: Poblar res.locals.apiUser desde DB si tenemos userId
    if (req.userId && !res.locals.apiUser) {
        try {
            const cached = userCache.get(req.userId);

            if (cached && cached.expiry > now) {
                res.locals.apiUser = cached.user;
            } else {
                let userPromise = pendingUserDbRequests.get(req.userId);

                if (!userPromise) {
                    userPromise = dbService.getUser(req.userId).finally(() => {
                        pendingUserDbRequests.delete(req.userId!);
                    });
                    pendingUserDbRequests.set(req.userId, userPromise);
                }

                const user = await userPromise;

                if (user) {
                    res.locals.apiUser = user;

                    if (userCache.size >= MAX_CACHE_SIZE) {
                        const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.25);
                        const iterator = userCache.keys();
                        for (let i = 0; i < entriesToRemove; i++) {
                            const key = iterator.next().value;
                            if (key) userCache.delete(key);
                        }
                    }

                    userCache.set(req.userId, { user, expiry: now + CACHE_TTL });
                }
            }
        } catch (e) {
            logger.error('Error fetching user for unified rate limit:', e);
        }
    }

    if (req.userId) {
        throttledUpdateLastActive(req.userId);
    }

    req.twitchToken = token;
    next();
};

/**
 * Invalida la caché de usuario local.
 */
export const invalidateAuthCache = (userId: string) => {
    userCache.delete(userId);
};

export default checkToken;
