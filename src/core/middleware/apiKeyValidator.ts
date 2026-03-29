import { Request, Response, NextFunction } from 'express';
import * as dbService from '../database/dbService';
import { getValidToken } from '../../features/auth/auth.service';
import { logger } from '../utils/logger';
import { isPublicRoute } from '../utils/routeHelpers';
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

    const now = Date.now();

    // 1. Sanitizar y Validar Formato (UUID con o sin guiones)
    if (apiKey) {
        apiKey = apiKey.trim().toLowerCase();

        // Acepta 32 caracteres hexadecimales (con o sin guiones opcionales)
        const apiKeyRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
        if (!apiKeyRegex.test(apiKey)) {
            logger.warn(`[Security] API Key con formato inválido detectada desde IP: ${req.ip}`);
            apiKey = '';
        }
    }

    // 2. Caché Negativa (Evitar ataques de fuerza bruta a la DB)
    if (apiKey && invalidKeysCache.has(apiKey)) {
        const expiry = invalidKeysCache.get(apiKey)!;
        if (now < expiry) {
            return res.status(401).json({ error: 'Clave API bloqueada temporalmente.' });
        }
        invalidKeysCache.delete(apiKey);
    }

    // Si hay una API Key, la validamos SIEMPRE, incluso si la ruta parece pública (ej. /minigames/russian)
    // Esto previene que una clasificación fallida de isPublicRoute bloquee la autenticación.
    const isSystemRoute = isPublicRoute(cleanPath);

    if (isSystemRoute && !apiKey) {
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
        } else if (user && !user.isActive) {
            return res.status(403).json({ error: 'Cuenta suspendida.' });
        }
    } catch (error) {
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

        logger.warn('API Key validation failed in validator:', (error as Error).message);

        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send('Error de autenticación. Clave API inválida.');
        }
        return res.status(401).json({ error: 'Clave API inválida.' });
    }

    next();
};
