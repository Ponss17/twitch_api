import { Request, Response, NextFunction } from 'express';
import * as dbService from '../services/infrastructure/dbService';
import { logger } from '../utils/logger';

const validKeysCache = new Map<string, any>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 1000; // Límite de seguridad para memoria

export const apiKeyValidator = async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.query.apiKey as string;

    if (!apiKey) {
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

        const user = await dbService.getUserByApiKey(apiKey);
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
        logger.error('Error validating API Key:', error);
    }

    next();
};
