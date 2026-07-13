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
import { blockIfUnauthorizedScanExceeded } from './redisRateLimiter';
import { readSessionUserId, clearSessionCookie } from '../utils/sessionCookie';
import { getValidTokenForUser } from '../../features/auth/auth.service';
import { AppError } from '../errors/AppError';

const CACHE_TTL = 10 * 60 * 1000;
const TOKEN_VALIDATION_TTL = 10 * 60 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 30 * 60 * 1000;

const userCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
const invalidTokensCache = new NegativeCache<string>(30 * 1000);
const lastActiveThrottle = new BoundedMap<string, number>(1000);
const pendingUserDbRequests = new Map<string, Promise<StoredUser | null>>();

type CookieResolveResult =
    | { status: 'ok'; user: StoredUser }
    | { status: 'missing' }
    | { status: 'transient' };

function isAuthCookieError(error: unknown): boolean {
    const err = error as AppError | Error;
    const statusCode = err instanceof AppError ? err.statusCode : undefined;
    const message = err.message ?? '';
    return (
        statusCode === 401 ||
        message.includes('inválid') ||
        message.includes('expirad') ||
        message.includes('Sesión expirada')
    );
}

function isTransientCookieError(error: unknown): boolean {
    if (isAuthCookieError(error)) return false;
    const message = (error as Error).message ?? '';
    return (
        message.includes('fetch failed') ||
        message.includes('ECONN') ||
        message.includes('ETIMEDOUT') ||
        message.includes('timeout') ||
        message.includes('network')
    );
}

function respondSessionUnavailable(res: Response, req: AuthenticatedRequest): Response {
    if (isJsonApiRoute(req.path)) {
        return jsonError(res, 503, 'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.', {
            code: 'SERVICE_UNAVAILABLE',
            details: { offline: true }
        });
    }
    if (isApiRoute(req.path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res
            .status(503)
            .send('Servicio de autenticación no disponible. Intenta de nuevo.');
    }
    return jsonError(res, 503, 'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.', {
        code: 'SERVICE_UNAVAILABLE',
        details: { offline: true }
    });
}

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

const requestPath = (req: AuthenticatedRequest) => req.originalUrl?.split('?')[0] || req.path;

const rejectUnauthorized = async (
    req: AuthenticatedRequest,
    res: Response,
    respond: () => Response
): Promise<Response> => {
    if (await blockIfUnauthorizedScanExceeded(req, res, requestPath(req))) {
        return res;
    }
    return respond();
};

async function tryResolveCookieSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<CookieResolveResult> {
    const cookieUserId = readSessionUserId(req);
    if (!cookieUserId) return { status: 'missing' };

    const revoked = await cacheService.get<boolean>(`auth:revoke:user:${cookieUserId}`);
    if (revoked) {
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
        req.userId = user.userId;
        req.login = user.login;
        req.displayName = user.displayName;
        req.twitchToken = accessToken;
        return { status: 'ok', user };
    } catch (error) {
        logger.warn('[Auth] Cookie session error:', (error as Error).message);

        if (isAuthCookieError(error)) {
            clearSessionCookie(res);
            return { status: 'missing' };
        }
        if (isTransientCookieError(error)) {
            return { status: 'transient' };
        }
        return { status: 'missing' };
    }
}

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
                        if (pendingUserDbRequests.size >= 500) {
                            const first = pendingUserDbRequests.keys().next().value;
                            if (first) pendingUserDbRequests.delete(first);
                        }
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
