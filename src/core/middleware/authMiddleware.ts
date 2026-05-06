import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, StoredUser } from '../../types/twitch';
import * as apiService from '../../features/twitch/twitch.service';
import * as dbService from '../database/dbService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';
import { isPublicRoute, isApiRoute } from '../utils/routeHelpers';
import { safeString } from '../utils/validationHelpers';
import { BoundedMap, NegativeCache } from '../utils/boundedCache';

const CACHE_TTL = 60 * 1000;
const TOKEN_VALIDATION_TTL = 30 * 1000;
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

const userCache = new BoundedMap<string, { user: StoredUser; expiry: number }>(1000);
const invalidTokensCache = new NegativeCache<string>(30 * 1000);
const validTokensCache = new BoundedMap<
    string,
    { data: { user_id: string; login: string }; expiry: number }
>(1000);
const lastActiveThrottle = new BoundedMap<string, number>(1000);
const pendingUserDbRequests = new Map<string, Promise<StoredUser | null>>();

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
    if (res.locals.apiUser) {
        const user = res.locals.apiUser;
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
    }

    if (!token) {
        if (isPublicRoute(req.path, req.method)) {
            return next();
        }

        if (isApiRoute(req.path)) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
        }
        return res.status(401).json({ error: MESSAGES.AUTH.MISSING_TOKEN_URL });
    }

    if (invalidTokensCache.has(token)) {
        return res.status(401).json({ error: MESSAGES.AUTH.INVALID_TOKEN });
    }

    if (!req.userId || !req.login) {
        const cachedValidation = validTokensCache.get(token);
        if (cachedValidation && cachedValidation.expiry > Date.now()) {
            req.userId = cachedValidation.data.user_id;
            req.login = cachedValidation.data.login;
        } else {
            if (cachedValidation) validTokensCache.delete(token);
            try {
                const validation = await apiService.validateToken(token);
                if (validation) {
                    if (validation.user_id) req.userId = validation.user_id;
                    if (validation.login) req.login = validation.login;

                    validTokensCache.set(token, {
                        data: { user_id: validation.user_id, login: validation.login },
                        expiry: Date.now() + TOKEN_VALIDATION_TTL
                    });
                } else {
                    invalidTokensCache.set(token);
                    return res.status(401).json({ error: MESSAGES.AUTH.INVALID_TOKEN });
                }
            } catch (_e) {
                invalidTokensCache.set(token);
                logger.warn('Error Middleware Auth: Could not validate token to extract user data');
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

    if (req.userId) {
        throttledUpdateLastActive(req.userId);
    }

    req.twitchToken = token;
    next();
};

export const invalidateAuthCache = (userId: string) => {
    userCache.delete(userId);
};

export default checkToken;
