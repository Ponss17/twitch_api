import { Request, Response, NextFunction } from 'express';
import * as dbService from '../database/dbService';
import * as cacheService from '../database/cacheService';
import { getValidTokenForUser } from '../../features/auth/auth.service';
import { logger } from '../utils/logger';
import { invalidateAuthCache } from './authMiddleware';
import { StoredUser } from '../../types/twitch';
import { BoundedMap, NegativeCache } from '../utils/boundedCache';
import { isBotCommand, isApiRoute } from '../utils/routeHelpers';

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
        for (const apiKey of keysToInvalidate) {
            cacheService
                .invalidateApiKeyCache(apiKey)
                .catch((e) => logger.error('Error invalidate KV key cache iteration:', e));
        }
        logger.info(
            `[Cache] Invalidated ${keysToInvalidate.length} API Key entries for userId: ${userId}`
        );
    }

    invalidateAuthCache(userId);
};

export const apiKeyValidator = async (req: Request, res: Response, next: NextFunction) => {
    const rawApiKey = ((req.query.apiKey as string) || (req.headers['x-api-key'] as string) || '')
        .trim()
        .toLowerCase();

    const apiKeyRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    const apiKey = rawApiKey && apiKeyRegex.test(rawApiKey) ? rawApiKey : '';

    if (rawApiKey && !apiKey) {
        logger.warn(`[Security] API Key con formato inválido detectada desde IP: ${req.ip}`);
    }

    if (apiKey && invalidKeysCache.has(apiKey)) {
        return res.status(401).json({ error: 'Clave API bloqueada temporalmente.' });
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
            const errorMsg = 'Error de autenticación. Clave API inválida o expirada. Regenerala o pide ayuda a Ponss 🦆';
            if (isApiRoute(req.path)) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(401).send(errorMsg);
            }
            return res.status(401).json({ error: errorMsg });
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
            res.setHeader('Content-Type', 'text/plain');
            return res.status(isAuthError ? 401 : 503).send(errorMsg);
        }

        return res.status(isAuthError ? 401 : 503).json({ error: errorMsg });
    }

    next();
};
