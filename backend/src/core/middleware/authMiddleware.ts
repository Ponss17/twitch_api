import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, StoredUser } from '../../types/twitch';
import * as apiService from '../../features/twitch/twitch.service';
import * as dbService from '../database/dbService';
import * as cacheService from '../database/cacheService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';
import { isPublicRoute, isApiRoute, isJsonApiRoute, isOAuthCallbackRoute } from '../utils/routeHelpers';
import { safeString } from '../utils/validationHelpers';
import { BoundedMap, NegativeCache } from '../utils/boundedCache';
import { jsonError } from '../utils/jsonResponse';
import { readSessionClaims, clearSessionCookie } from '../utils/sessionCookie';
import { validateSessionState } from '../utils/sessionState';
import { getValidTokenForUser } from '../../features/auth/auth.service';
import {
    type CookieResolveResult,
    isAuthCookieError,
    isTransientCookieError,
    rejectInactiveUser,
    rejectUnauthorized,
    respondAuthServiceUnavailable,
    respondSessionUnavailable
} from './authMiddleware.helpers';

const CACHE_TTL = 10 * 60 * 1000;
const TOKEN_VALIDATION_TTL = 10 * 60 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 30 * 60 * 1000;

const userCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
const invalidTokensCache = new NegativeCache<string>(30 * 1000);
const lastActiveThrottle = new BoundedMap<string, number>(1000);
const pendingUserDbRequests = new BoundedMap<string, Promise<StoredUser | null>>(500);

const throttledUpdateLastActive = (userId: string) => {
    const now = Date.now();
    const lastUpdate = lastActiveThrottle.get(userId);
    if (lastUpdate && now - lastUpdate < LAST_ACTIVE_THROTTLE_MS) return;

    lastActiveThrottle.set(userId, now);
    dbService.updateLastActive(userId).catch((err) => {
        logger.error('Error updating last active:', err);
    });
};

async function tryResolveCookieSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<CookieResolveResult> {
    const claims = readSessionClaims(req);
    if (!claims) return { status: 'missing' };
    const cookieUserId = claims.userId;

    const sessionState = await validateSessionState(claims);
    if (sessionState === 'unavailable') {
        return { status: 'transient' };
    }
    if (sessionState === 'revoked') {
        clearSessionCookie(res);
        return { status: 'missing' };
    }

    try {
        const user = await dbService.getUser(cookieUserId);
        if (!user || user.isActive === false) {
            clearSessionCookie(res);
            return { status: 'missing' };
        }

        const { accessToken } = await getValidTokenForUser(user);
        user.accessToken = accessToken;
        res.locals.apiUser = user;
        res.locals.isCookieSession = true;
        res.locals.authSource = 'cookie';
        req.userId = user.userId;
        req.login = user.login;
        req.displayName = user.displayName;
        req.userTimezone = user.timezone ?? 'UTC';
        req.twitchToken = accessToken;
        return { status: 'ok', user };
    } catch (error) {
        logger.warn('[Auth] Cookie session error:', (error as Error).message);

        if (isAuthCookieError(error)) {
            clearSessionCookie(res);
            return { status: 'missing' };
        }
        // DB/red/desconocido: no borrar cookie (evita falsos logouts).
        return { status: 'transient' };
    }
}

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (res.locals.apiUser) {
            const user = res.locals.apiUser as StoredUser;
            if (!res.locals.authSource) {
                res.locals.authSource = res.locals.isApiKeyRequest
                    ? 'apiKey'
                    : res.locals.isCookieSession
                      ? 'cookie'
                      : 'bearer';
            }
            if (user.isActive === false) {
                return rejectInactiveUser(res, req.path);
            }
            req.userId = user.userId;
            req.login = user.login;
            req.displayName = user.displayName;

            if (res.locals.isOverlayReadRequest) {
                return next();
            }

            try {
                const { accessToken } = await getValidTokenForUser(user);
                user.accessToken = accessToken;
                req.twitchToken = accessToken;
            } catch (error) {
                if (isTransientCookieError(error)) {
                    return respondSessionUnavailable(res, req);
                }
                if (isAuthCookieError(error)) {
                    return await rejectUnauthorized(req, res, () =>
                        jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN)
                    );
                }
                req.twitchToken = user.accessToken;
            }

            throttledUpdateLastActive(user.userId);
            return next();
        }

        const requestPath = req.originalUrl?.split('?')[0] || req.path;
        if (isOAuthCallbackRoute(requestPath)) {
            return next();
        }

        const cookieResult = await tryResolveCookieSession(req, res);
        if (cookieResult.status === 'ok') {
            const cookieUser = cookieResult.user;
            if (cookieUser.isActive === false) {
                return rejectInactiveUser(res, req.path);
            }
            throttledUpdateLastActive(cookieUser.userId);
            return next();
        }
        if (cookieResult.status === 'transient') {
            return respondSessionUnavailable(res, req);
        }

        const queryToken = safeString(req.query.token) || safeString(req.body?.token);
        let token = '';

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (queryToken && !token) {
            const ip = req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown';
            if (process.env.NODE_ENV === 'production') {
                logger.warn('[Security] Token en query/body rechazado en producción', {
                    ip,
                    path: req.path
                });
            } else {
                logger.warn('[Security] Token recibido en query/body (deprecado) — usar Authorization: Bearer', {
                    ip,
                    path: req.path
                });
                token = queryToken;
            }
        }

        if (!token) {
            if (isPublicRoute(req.path, req.method)) {
                return next();
            }

            if (isJsonApiRoute(req.path)) {
                return await rejectUnauthorized(req, res, () =>
                    jsonError(res, 401, MESSAGES.AUTH.MISSING_TOKEN_URL)
                );
            }

            if (isApiRoute(req.path)) {
                return await rejectUnauthorized(req, res, () => {
                    res.setHeader('Content-Type', 'text/plain');
                    return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
                });
            }
            return await rejectUnauthorized(req, res, () =>
                jsonError(res, 401, MESSAGES.AUTH.MISSING_TOKEN_URL)
            );
        }

        if (invalidTokensCache.has(token)) {
            return await rejectUnauthorized(req, res, () =>
                jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN)
            );
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
                        invalidTokensCache.delete(token);

                        await cacheService.set(
                            cacheKey,
                            { user_id: validation.user_id, login: validation.login },
                            TOKEN_VALIDATION_TTL / 1000
                        );
                    } else {
                        invalidTokensCache.set(token);
                        return await rejectUnauthorized(req, res, () =>
                            jsonError(res, 401, MESSAGES.AUTH.INVALID_TOKEN)
                        );
                    }
                } catch (e) {
                    logger.warn(
                        'Error Middleware Auth: fallo transitorio validando token contra Twitch',
                        (e as Error).message
                    );
                    if (isJsonApiRoute(req.path)) {
                        return respondAuthServiceUnavailable(res, req.path);
                    }
                    if (isApiRoute(req.path)) {
                        res.setHeader('Content-Type', 'text/plain');
                        return res
                            .status(503)
                            .send('Servicio de autenticación no disponible. Intenta de nuevo.');
                    }
                    return respondAuthServiceUnavailable(res, req.path);
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

        // Siempre propagar la timezone del usuario autenticado al request,
        // para que trackRequest la pase a recordUserRequest y evite el fallback a UTC en cold starts.
        if (apiUser?.timezone && !req.userTimezone) {
            req.userTimezone = apiUser.timezone;
        }

        if (req.userId) {
            throttledUpdateLastActive(req.userId);
        }

        req.twitchToken = token;
        if (!res.locals.authSource) {
            res.locals.authSource = 'bearer';
        }
        next();
    } catch (e) {
        logger.error('Error Middleware Auth:', e);
        if (isJsonApiRoute(req.path)) {
            return respondAuthServiceUnavailable(res, req.path);
        }
        if (isApiRoute(req.path)) {
            res.setHeader('Content-Type', 'text/plain');
            return res
                .status(503)
                .send('Servicio de autenticación no disponible. Intenta de nuevo.');
        }
        return respondAuthServiceUnavailable(res, req.path);
    }
};

export const invalidateAuthCache = (
    userId: string,
    _options?: { revokeSession?: boolean }
) => {
    userCache.delete(userId);
};

export const unrevokeAuthSession = async (userId: string): Promise<void> => {
    void userId;
};

export default checkToken;
