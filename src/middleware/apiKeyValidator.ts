import { Request, Response, NextFunction } from 'express';
import * as dbService from '../services/infrastructure/dbService';
import * as authService from '../services/auth/authService';
import { logger } from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validKeysCache = new Map<string, any>();
const CACHE_TTL_MS = 1 * 60 * 1000; // Reducido a 1 minuto para mayor seguridad con tokens
const MAX_CACHE_SIZE = 1000;

import { isPublicRoute } from '../utils/routeHelpers';

import { invalidateAuthCache } from './authMiddleware';

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
    const apiKey = (req.query.apiKey as string) || (req.headers['x-api-key'] as string);
    const cleanPath = req.originalUrl.split('?')[0];

    // Use centralized check
    const isSystemRoute = isPublicRoute(cleanPath);

    if (!apiKey || isSystemRoute) {
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

        const authData = await authService.getValidToken(apiKey);
        const user = await dbService.getUser(authData.userId);

        if (user && user.isActive) {
            if (validKeysCache.size >= MAX_CACHE_SIZE) {
                validKeysCache.clear();
            }

            validKeysCache.set(apiKey, {
                user,
                expiry: now + CACHE_TTL_MS
            });
            res.locals.apiUser = user;
        }
    } catch (error) {
        logger.warn('API Key validation failed in validator:', (error as Error).message);
    }

    next();
};
