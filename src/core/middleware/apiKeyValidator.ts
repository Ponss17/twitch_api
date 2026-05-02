import { Request, Response, NextFunction } from 'express';
import * as dbService from '../database/dbService';
import * as cacheService from '../database/cacheService';
import { getValidToken } from '../../features/auth/auth.service';
import { logger } from '../utils/logger';
import { invalidateAuthCache } from './authMiddleware';
import { StoredUser } from '../../types/twitch';

interface CachedApiKey {
    user: StoredUser;
    expiry: number;
}

const validKeysCache = new Map<string, CachedApiKey>();
const invalidKeysCache = new Map<string, number>(); // Cache negativa: apiKey -> timestamp expiración
const CACHE_TTL_MS = 1 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 30 * 1000; // Bloquear llaves inválidas por 30 segundos
const MAX_CACHE_SIZE = 1000;

/**
 * Invalida la caché de API Key y de sesión para un userId específico.
 * Llamar esto cuando el admin cambia el rate limit u otros datos del usuario.
 */
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
    // 1. Obtención y normalización de la API Key
    const rawApiKey = ((req.query.apiKey as string) || (req.headers['x-api-key'] as string) || '')
        .trim()
        .toLowerCase();

    // Validar formato (UUID hexadecimal de 32 caracteres con/sin guiones)
    const apiKeyRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    const apiKey = rawApiKey && apiKeyRegex.test(rawApiKey) ? rawApiKey : '';

    if (rawApiKey && !apiKey) {
        logger.warn(`[Security] API Key con formato inválido detectada desde IP: ${req.ip}`);
    }

    const now = Date.now();

    // 2. Caché Negativa (Evitar ataques de fuerza bruta a la DB)
    if (apiKey && invalidKeysCache.has(apiKey)) {
        const expiry = invalidKeysCache.get(apiKey)!;
        if (now < expiry) {
            return res.status(401).json({ error: 'Clave API bloqueada temporalmente.' });
        }
        invalidKeysCache.delete(apiKey);
    }

    if (!apiKey) {
        return next();
    }

    try {
        if (apiKey && validKeysCache.has(apiKey)) {
            const cached = validKeysCache.get(apiKey)!;
            if (cached.expiry > now) {
                res.locals.apiUser = cached.user;
                return next();
            }
            validKeysCache.delete(apiKey);
        }

        // 3. Caché KV (cross-invocation en Vercel): hit = 0 consultas a Supabase
        const kvCachedUser = await cacheService.getCachedApiUser(apiKey);
        if (kvCachedUser) {
            if (!kvCachedUser.isActive) {
                return res.status(403).json({ error: 'Cuenta suspendida.' });
            }
            res.locals.apiUser = kvCachedUser;
            res.locals.isApiKeyRequest = true;
            validKeysCache.set(apiKey, { user: kvCachedUser, expiry: now + CACHE_TTL_MS });
            return next();
        }

        const authData = await getValidToken(apiKey);
        const user = await dbService.getUser(authData.userId);

        if (user && user.isActive) {
            if (validKeysCache.size >= MAX_CACHE_SIZE) {
                const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.25);
                const iterator = validKeysCache.keys();
                for (let i = 0; i < entriesToRemove; i++) {
                    const key = iterator.next().value;
                    if (key) validKeysCache.delete(key);
                }
            }

            validKeysCache.set(apiKey, { user, expiry: now + CACHE_TTL_MS });
            cacheService
                .setCachedApiUser(apiKey, user)
                .catch((e) => logger.error('Error setCachedApiUser KV:', e));
            res.locals.apiUser = user;
            res.locals.isApiKeyRequest = true;
        } else if (user && !user.isActive) {
            return res.status(403).json({ error: 'Cuenta suspendida.' });
        }
    } catch (e) {
        const error = e as Error;
        // Registro en caché negativa para evitar re-consultar esta llave inválida en los próximos 30s
        if (apiKey) {
            invalidKeysCache.set(apiKey, now + NEGATIVE_CACHE_TTL_MS);

            // Limpieza periódica de la caché negativa si crece demasiado
            if (invalidKeysCache.size > 2000) {
                const iterator = invalidKeysCache.keys();
                for (let i = 0; i < 500; i++) {
                    const key = iterator.next().value;
                    if (key) invalidKeysCache.delete(key);
                }
            }
        }

        logger.warn('API Key validation failed in validator:', error.message);

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send('Error de autenticación. Clave API inválida.');
        }
        return res.status(401).json({ error: 'Clave API inválida.' });
    }

    next();
};
