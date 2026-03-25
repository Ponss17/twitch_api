import { Request, Response, NextFunction } from 'express';
import * as dbService from '../database/dbService';
import { getValidToken } from '../../features/auth/auth.service';
import { logger } from '../utils/logger';
import { isPublicRoute } from '../utils/routeHelpers';
import { invalidateAuthCache } from './authMiddleware';
import { StoredUser } from '../../types/twitch';

interface CachedApiKey {
    user: StoredUser; // StoredUser is no longer imported, this will cause a type error.
    expiry: number;
}

const validKeysCache = new Map<string, CachedApiKey>();
const CACHE_TTL_MS = 1 * 60 * 1000; // Reducido a 1 minuto para mayor seguridad con tokens
const MAX_CACHE_SIZE = 1000;

/**
 * Invalida la caché de API Key y de sesión para un userId específico.
 * Llamar esto cuando el admin cambia el rate limit u otros datos del usuario.
 */
export const invalidateUserCache = (userId: string): void => {
    let invalidatedKeys = 0;
    for (const [key, cached] of validKeysCache.entries()) {
        if (cached.user?.userId === userId) {
            validKeysCache.delete(key);
            invalidatedKeys++;
        }
    }

    // Invalidar también la caché de sesión (Dashboard)
    invalidateAuthCache(userId);

    if (invalidatedKeys > 0) {
        logger.info(`[Cache] Invalidated ${invalidatedKeys} API Key entries for userId: ${userId}`);
    }
};

export const apiKeyValidator = async (req: Request, res: Response, next: NextFunction) => {
    let apiKey = (req.query.apiKey as string) || (req.headers['x-api-key'] as string);
    const cleanPath = req.originalUrl.split('?')[0];

    // Mantenemos sanitize estricto del apiKey: no puede tener más de 64 chars ni caracteres raros
    if (apiKey) {
        if (apiKey.length > 64 || /[^a-zA-Z0-9-]/.test(apiKey)) {
            apiKey = ''; // Se anula como string malicioso
        }
    }

    // Si hay una API Key, la validamos SIEMPRE, incluso si la ruta parece pública (ej. /minigames/russian)
    // Esto previene que una clasificación fallida de isPublicRoute bloquee la autenticación.
    const isSystemRoute = isPublicRoute(cleanPath);

    if (isSystemRoute && !apiKey) {
        return next();
    }

    try {
        const now = Date.now();

        if (validKeysCache.has(apiKey)) {
            const cached = validKeysCache.get(apiKey)!;
            if (cached.expiry > now) {
                res.locals.apiUser = cached.user;
                return next();
            }
            validKeysCache.delete(apiKey);
        }

        const authData = await getValidToken(apiKey);
        const user = await dbService.getUser(authData.userId);

        if (user && user.isActive) {
            if (validKeysCache.size >= MAX_CACHE_SIZE) {
                // LRU-style eviction: remove oldest 25% of entries
                const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.25);
                const iterator = validKeysCache.keys();
                for (let i = 0; i < entriesToRemove; i++) {
                    const key = iterator.next().value;
                    if (key) validKeysCache.delete(key);
                }
            }

            validKeysCache.set(apiKey, {
                user,
                expiry: now + CACHE_TTL_MS
            });
            res.locals.apiUser = user;
            res.locals.isApiKeyRequest = true;
        }
    } catch (error) {
        logger.warn('API Key validation failed in validator:', (error as Error).message);

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send('Error de autenticación. Clave API inválida.');
        }
        return res.status(401).json({ error: 'Clave API inválida.' });
    }

    next();
};
