import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, StoredUser } from '../../types/twitch';
import * as apiService from '../../features/twitch/twitch.service';
import * as dbService from '../database/dbService';
import * as cacheService from '../database/cacheService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';
import { isPublicRoute, isApiRoute, isJsonApiRoute } from '../utils/routeHelpers';
import { safeString } from '../utils/validationHelpers';
import { BoundedMap, NegativeCache } from '../utils/boundedCache';
import { jsonError } from '../utils/jsonResponse';

const CACHE_TTL = 10 * 60 * 1000;
const TOKEN_VALIDATION_TTL = 10 * 60 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 30 * 60 * 1000;

const userCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
const invalidTokensCache = new NegativeCache<string>(30 * 1000);
const lastActiveThrottle = new BoundedMap<string, number>(1000);
const pendingUserDbRequests = new Map<string, Promise<StoredUser | null>>();

function rejectInactiveUser(res: Response, path: string): Response {
    if (isJsonApiRoute(path)) {
        return jsonError(res, 403, 'Cuenta suspendida.', { code: 'ACCOUNT_SUSPENDED' });
    }
    if (isApiRoute(path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send('Cuenta suspendida.');
    }
    return jsonError(res, 403, 'Cuenta suspendida.', { code: 'ACCOUNT_SUSPENDED' });
}

const throttledUpdateLastActive = (userId: string) => {
    const now = Date.now();
    const lastUpdate = lastActiveThrottle.get(userId);
    if (lastUpdate && now - lastUpdate < LAST_ACTIVE_THROTTLE_MS) return;

    lastActiveThrottle.set(userId, now);
    dbService.updateLastActive(userId).catch((err) => {
        logger.error('Error updating last active:', err);
    });
};

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (res.locals.apiUser) {
            const user = res.locals.apiUser as StoredUser;
            if (user.isActive === false) {
                return rejectInactiveUser(res, req.path);
            }
            req.userId = user.userId;
            req.login = user.login;
            req.displayName = user.displayName;
            req.twitchToken = user.accessToken;

            throttledUpdateLastActive(user.userId);
            return next();
        }

        let token = safeString(req.query.token) || safeString(req.body?.token);

        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (safeString(req.query.token) || safeString(req.body?.token)) {
            logger.warn('[Security] Token OAuth recibido en query/body — usar Authorization: Bearer');
        }

        if (!token) {
            if (isPublicRoute(req.path, req.method)) {
                return next();
            }

            if (isJsonApiRoute(req.path)) {
                return jsonError(res, 401, MESSAGES.AUTH.MISSING_TOKEN_URL);
            }

            if (isApiRoute(req.path)) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
            }
            return jsonError(res, 401, MESSAGES.AUTH.MISSING_TOKEN_URL);
        }

        if (invalidTokensCache.has(token)) {
            return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
        }

        if (!req.userId || !req.login) {
            const cacheKey = `cache:tokenValidation:${token}`;
            const cachedValidation = await cacheService.get<{ user_id: string; login: string }>(
                cacheKey
            );

            if (cachedValidation) {
                const revoked = await cacheService.get<boolean>(
                    `auth:revoke:user:${cachedValidation.user_id}`
                );
                if (revoked) {
                    await cacheService.del(cacheKey);
                } else {
                    req.userId = cachedValidation.user_id;
                    req.login = cachedValidation.login;
                }
            }

            if (!req.userId || !req.login) {
                try {
                    const validation = await apiService.validateToken(token);
                    if (validation) {
                        if (validation.user_id) req.userId = validation.user_id;
                        if (validation.login) req.login = validation.login;

                        await cacheService.set(
                            cacheKey,
                            { user_id: validation.user_id, login: validation.login },
                            TOKEN_VALIDATION_TTL / 1000
                        );
                    } else {
                        invalidTokensCache.set(token);
                        return jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN);
                    }
                } catch (e) {
                    logger.warn(
                        'Error Middleware Auth: fallo transitorio validando token contra Twitch',
                        (e as Error).message
                    );
                    if (isJsonApiRoute(req.path)) {
                        return jsonError(
                            res,
                            503,
                            'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
                            { code: 'SERVICE_UNAVAILABLE' }
                        );
                    }
                    if (isApiRoute(req.path)) {
                        res.setHeader('Content-Type', 'text/plain');
                        return res
                            .status(503)
                            .send('Servicio de autenticación no disponible. Intenta de nuevo.');
                    }
                    return jsonError(
                        res,
                        503,
                        'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
                        { code: 'SERVICE_UNAVAILABLE' }
                    );
                }
            }
        }

        if (req.userId && !res.locals.apiUser) {
            try {
                const cached = userCache.get(req.userId);

                if (cached && cached.expiry > Date.now()) {
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
                        userCache.set(req.userId, { user, expiry: Date.now() + CACHE_TTL });
                    }
                }
            } catch (e) {
                logger.error('Error fetching user for unified rate limit:', e);
            }
        }

        const apiUser = res.locals.apiUser as StoredUser | undefined;
        if (apiUser?.isActive === false) {
            return rejectInactiveUser(res, req.path);
        }

        if (req.userId) {
            throttledUpdateLastActive(req.userId);
        }

        req.twitchToken = token;
        next();
    } catch (e) {
        logger.error('Error Middleware Auth:', e);
        if (isJsonApiRoute(req.path)) {
            return jsonError(
                res,
                503,
                'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
                { code: 'SERVICE_UNAVAILABLE' }
            );
        }
        if (isApiRoute(req.path)) {
            res.setHeader('Content-Type', 'text/plain');
            return res
                .status(503)
                .send('Servicio de autenticación no disponible. Intenta de nuevo.');
        }
        return jsonError(
            res,
            503,
            'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
            { code: 'SERVICE_UNAVAILABLE' }
        );
    }
};

export const invalidateAuthCache = (userId: string) => {
    userCache.delete(userId);
    void cacheService.set(`auth:revoke:user:${userId}`, true, TOKEN_VALIDATION_TTL / 1000);
};

export default checkToken;
