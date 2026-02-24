import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, StoredUser } from '../types/twitch';
import * as authService from '../services/auth/authService';
import * as apiService from '../services/twitch/apiService';
import * as dbService from '../services/infrastructure/dbService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';
import { isPublicRoute } from '../utils/routeHelpers';

const userCache = new Map<string, { user: StoredUser; expiry: number }>();
const CACHE_TTL = 60 * 1000;

// Throttle updateLastActive to once per 5 minutes per user
const lastActiveThrottle = new Map<string, number>();
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

const throttledUpdateLastActive = (userId: string) => {
    const now = Date.now();
    const lastUpdate = lastActiveThrottle.get(userId) || 0;
    if (now - lastUpdate < LAST_ACTIVE_THROTTLE_MS) return;

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
    const apiKey =
        safeString(req.query.apiKey) ||
        safeString(req.body?.apiKey) ||
        safeString(req.headers['x-api-key']);

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (apiKey) {
        try {
            const authData = await authService.getValidToken(apiKey);
            token = authData.accessToken;
            req.userId = authData.userId;
        } catch (error: unknown) {
            const err = error as Error;
            logger.error('Middleware Auth Error (API Key lookup):', err.message);

            if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(401).send(MESSAGES.AUTH.INVALID_CREDENTIALS);
            }
            return res.status(401).json({ error: MESSAGES.AUTH.INVALID_CREDENTIALS });
        }
    }

    if (!token) {
        // En rutas públicas, permitimos continuar aunque no haya token
        if (isPublicRoute(req.path)) {
            return next();
        }

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
        }
        return res.status(401).json({ error: MESSAGES.AUTH.MISSING_TOKEN_URL });
    }

    if (!req.userId || !req.login) {
        try {
            const validation = await apiService.validateToken(token);
            if (validation) {
                if (validation.user_id) req.userId = validation.user_id;
                if (validation.login) req.login = validation.login;
            }
        } catch (_e) {
            logger.warn('Error Middleware Auth: Could not validate token to extract user data');
        }
    }

    // Unificación de Rate Limit: Poblar res.locals.apiUser desde DB si tenemos userId
    if (req.userId && !res.locals.apiUser) {
        try {
            const now = Date.now();
            const cached = userCache.get(req.userId);

            if (cached && cached.expiry > now) {
                res.locals.apiUser = cached.user;
            } else {
                const user = await dbService.getUser(req.userId);
                if (user) {
                    res.locals.apiUser = user;
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
