import { Request, Response, NextFunction } from 'express';
import * as dbService from '../database/dbService';
import * as cacheService from '../database/cacheService';
import {
    getValidTokenForUser,
    verifyOverlayReadToken,
    isOAuthTokenNearExpiry,
    isOverlayTokenRevoked
} from '../../features/auth/auth.service';
import { toOverlayApiUser } from './overlayScope';
import { logger } from '../utils/logger';
import { invalidateAuthCache } from './authMiddleware';
import { StoredUser } from '../../types/twitch';
import { BoundedMap, NegativeCache } from '../utils/boundedCache';
import { isBotCommand, isApiRoute } from '../utils/routeHelpers';
import { blockIfUnauthorizedScanExceeded } from './redisRateLimiter';

interface CachedApiKey {
    user: StoredUser;
    expiry: number;
}

// 10 minutos: suficiente para no re-validar en cada comando del bot,
// pero lo suficientemente corto para reflejar cambios de cuenta (suspensions, regenerar key).
const CACHE_TTL_MS = 10 * 60 * 1000;
const validKeysCache = new BoundedMap<string, CachedApiKey>(1000);
const invalidKeysCache = new NegativeCache<string>(30 * 1000);

export const invalidateUserCache = (userId: string): void => {
    const keysToInvalidate: string[] = [];

    for (const [key, cached] of validKeysCache.entries()) {
        if (cached.user?.userId === userId) {
            validKeysCache.delete(key);
            keysToInvalidate.push(key);
        }
    }

    if (keysToInvalidate.length > 0) {
        for (const key of keysToInvalidate) {
            cacheService
                .invalidateApiKeyCache(key)
                .catch((e) => logger.error('Error invalidate KV key cache iteration:', e));
        }
        logger.info(
            `[Cache] Invalidated ${keysToInvalidate.length} API Key entries for userId: ${userId}`
        );
    }

    invalidateAuthCache(userId);
};

function readOverlayToken(req: Request): string {
    const fromHeader = ((req.headers['x-overlay-token'] as string) || '').trim();
    if (fromHeader) return fromHeader;
    return ((req.query.overlayToken as string) || '').trim();
}

async function rejectApiKeyUnauthorized(
    req: Request,
    res: Response,
    respond: () => Response
): Promise<Response> {
    const cleanPath = req.originalUrl?.split('?')[0] || req.path;
    if (await blockIfUnauthorizedScanExceeded(req, res, cleanPath)) {
        return res;
    }
    return respond();
}

/** Nightbot/SE: HTTP 200 + texto plano aunque la key falle (no tumba el comando del bot). */
async function rejectInvalidApiKey(
    req: Request,
    res: Response,
    errorMsg: string
): Promise<Response> {
    const path = req.path || req.originalUrl?.split('?')[0] || '';
    if (isBotCommand(path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(errorMsg);
    }
    if (isApiRoute(path)) {
        return rejectApiKeyUnauthorized(req, res, () => {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send(errorMsg);
        });
    }
    return rejectApiKeyUnauthorized(req, res, () => res.status(401).json({ error: errorMsg }));
}

export const apiKeyValidator = async (req: Request, res: Response, next: NextFunction) => {
    const overlayTokenHeader = readOverlayToken(req);

    if (overlayTokenHeader) {
        const payload = verifyOverlayReadToken(overlayTokenHeader);
        if (!payload) {
            return res.status(401).json({ error: 'Token de overlay inválido o expirado.' });
        }
        if (await isOverlayTokenRevoked(payload)) {
            return res.status(401).json({ error: 'Token de overlay revocado. Genera un enlace nuevo en el panel.' });
        }
        try {
            const user = await dbService.getUser(payload.userId);
            if (user?.isActive !== false) {
                res.locals.apiUser = toOverlayApiUser(payload);
                res.locals.isOverlayReadRequest = true;
                res.locals.overlayTool = payload.tool;
                return next();
            }
            return res.status(403).json({ error: 'Cuenta suspendida o no encontrada.' });
        } catch (e) {
            logger.error('Error validando overlay token:', e);
            return res.status(503).json({ error: 'Servicio no disponible temporalmente.' });
        }
    }

    const rawApiKey = ((req.query.apiKey as string) || (req.headers['x-api-key'] as string) || '')
        .trim()
        .toLowerCase();

    const apiKeyRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    const apiKey = rawApiKey && apiKeyRegex.test(rawApiKey) ? rawApiKey : '';

    if (rawApiKey && !apiKey) {
        logger.warn(`[Security] API Key con formato inválido detectada desde IP: ${req.ip}`);
    }

    if (apiKey && invalidKeysCache.has(apiKey)) {
        return rejectInvalidApiKey(req, res, 'Clave API bloqueada temporalmente.');
    }

    if (apiKey && (await cacheService.isApiKeyRevoked(apiKey))) {
        const dbUser = await dbService.getUserByApiKey(apiKey);
        if (dbUser?.isActive) {
            await cacheService.clearApiKeyRevocation(apiKey);
            try {
                await getValidTokenForUser(dbUser);
                validKeysCache.set(apiKey, { user: dbUser, expiry: Date.now() + CACHE_TTL_MS });
                res.locals.apiUser = dbUser;
                res.locals.isApiKeyRequest = true;
                return next();
            } catch (e) {
                const errorMsg = (e as Error).message;
                const isAuthError = errorMsg.includes('inválid') || errorMsg.includes('expirad');
                if (req.headers.authorization?.startsWith('Bearer ')) {
                    return next();
                }
                if (isAuthError) {
                    return rejectApiKeyUnauthorized(req, res, () =>
                        res.status(401).json({ error: errorMsg })
                    );
                }
                return res.status(503).json({ error: errorMsg });
            }
        }
        invalidKeysCache.set(apiKey);
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return next();
        }
        return rejectApiKeyUnauthorized(req, res, () =>
            res.status(401).json({ error: 'Clave API revocada. Regenera tu API Key en el panel.' })
        );
    }

    if (!apiKey) {
        return next();
    }

    try {
        const cached = validKeysCache.get(apiKey);
        if (cached && cached.expiry > Date.now()) {
            if (!cached.user.isActive) {
                return res.status(403).json({ error: 'Cuenta suspendida.' });
            }
            if (isOAuthTokenNearExpiry(cached.user)) {
                try {
                    await getValidTokenForUser(cached.user);
                    validKeysCache.set(apiKey, {
                        user: cached.user,
                        expiry: Date.now() + CACHE_TTL_MS
                    });
                } catch (e) {
                    const error = e as Error;
                    const isAuthError =
                        error.message.includes('inválid') || error.message.includes('expirad');
                    if (isAuthError) {
                        invalidKeysCache.set(apiKey);
                        return rejectApiKeyUnauthorized(req, res, () =>
                            res.status(401).json({ error: error.message })
                        );
                    }
                    return res.status(503).json({ error: 'Servicio no disponible temporalmente.' });
                }
            }
            res.locals.apiUser = cached.user;
            res.locals.isApiKeyRequest = true;
            return next();
        }
        if (cached) validKeysCache.delete(apiKey);

        const kvCachedMeta = await cacheService.getCachedApiUserMeta(apiKey);
        if (kvCachedMeta) {
            if (kvCachedMeta.isActive === false) {
                return res.status(403).json({ error: 'Cuenta suspendida.' });
            }

            const user = await dbService.getUser(kvCachedMeta.userId);
            if (user && user.isActive) {
                res.locals.apiUser = user;
                res.locals.isApiKeyRequest = true;
                validKeysCache.set(apiKey, { user, expiry: Date.now() + CACHE_TTL_MS });
                return next();
            }
            if (user && !user.isActive) {
                return res.status(403).json({ error: 'Cuenta suspendida.' });
            }
        }

        const user = await dbService.getUserByApiKey(apiKey);

        if (user && user.isActive) {
            await getValidTokenForUser(user);
            validKeysCache.set(apiKey, { user, expiry: Date.now() + CACHE_TTL_MS });
            cacheService
                .setCachedApiUser(apiKey, user)
                .catch((e) => logger.error('Error setCachedApiUser KV:', e));
            res.locals.apiUser = user;
            res.locals.isApiKeyRequest = true;
        } else if (user && !user.isActive) {
            return res.status(403).json({ error: 'Cuenta suspendida.' });
        } else {
            invalidKeysCache.set(apiKey);
            return rejectInvalidApiKey(
                req,
                res,
                'Error de autenticación. Clave API inválida o expirada. Regenerala o pide ayuda a Ponss 🦆'
            );
        }
    } catch (e) {
        const error = e as Error;
        const isAuthError = error.message.includes('inválid') || error.message.includes('expirad');

        if (apiKey && isAuthError) {
            invalidKeysCache.set(apiKey);
        }

        logger.warn('API Key validation failed in validator:', error.message);

        const isBotCmd = isBotCommand(req.path);

        const errorMsg = error.message.includes('Sesión expirada')
            ? error.message
            : isAuthError 
                ? 'Error de autenticación. Clave API inválida o expirada. Regenerala o pide ayuda a Ponss 🦆'
                : 'Servicio no disponible temporalmente (timeout).';

        if (isBotCmd) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(errorMsg);
        }

        if (isApiRoute(req.path)) {
            if (isAuthError) {
                return rejectApiKeyUnauthorized(req, res, () => {
                    res.setHeader('Content-Type', 'text/plain');
                    return res.status(401).send(errorMsg);
                });
            }
            res.setHeader('Content-Type', 'text/plain');
            return res.status(503).send(errorMsg);
        }

        if (isAuthError) {
            return rejectApiKeyUnauthorized(req, res, () =>
                res.status(401).json({ error: errorMsg })
            );
        }

        return res.status(503).json({ error: errorMsg });
    }

    next();
};
