import { Request, Response, NextFunction } from 'express';
import { kv } from '../database/redisClient';
import { isKvWriteAvailable } from '../database/cacheService';
import { RATE_LIMITS } from '../config/limits';
import { resolveUserRateLimit } from '../config/userRoles';
import { MESSAGES } from '../config/messages';
import { isPublicRoute, isPublicHtmlRoute, isApiRoute, isBotCommand } from '../utils/routeHelpers';
import { AuthenticatedRequest } from '../../types/twitch';
import { logger } from '../utils/logger';
import { rateLimitPagePath } from '../utils/frontendPaths';

function applyRateLimitHeaders(res: Response, limit: number, count: number): void {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
}

function getSafeIp(req: Request): string {
    return (req.ip || 'anon').replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);
}

async function incrementPerMinuteCounter(
    key: string
): Promise<number> {
    const currentWindow = Math.floor(Date.now() / 60000);

    if (!isKvWriteAvailable()) {
        return 0; // Fail-open en dev
    }

    try {
        const redisKey = `twitch_api:${key}:${currentWindow}`;
        const [count] = (await kv.pipeline().incr(redisKey).expire(redisKey, 60).exec()) as [
            number,
            number
        ];
        return count;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug(`KV counter failed for ${key}, fail-open en dev/test`, { error });
            return 0;
        }
        throw error;
    }
}

/**
 * Anti-escaneo: cuenta 401/intentos sin credenciales válidas por IP.
 * Devuelve true si ya debe bloquearse con 429.
 */
export async function blockIfUnauthorizedScanExceeded(
    req: Request,
    res: Response,
    cleanPath: string
): Promise<boolean> {
    const count = await incrementPerMinuteCounter(`rl:unauth:${getSafeIp(req)}`);
    applyRateLimitHeaders(res, RATE_LIMITS.UNAUTHORIZED, count);

    if (count > RATE_LIMITS.UNAUTHORIZED) {
        logger.warn(`🛑 Unauthorized scan limit exceeded for rl:unauth:${getSafeIp(req)} on ${cleanPath}`);
        await handleLimitExceeded(req, res, cleanPath);
        return true;
    }

    return false;
}

/**
 * Middleware de Rate Limiting Global usando Vercel KV (Redis).
 * Dashboard OAuth (`rl:sess:`), bots/API key e IPs anónimas usan KV para
 * consistencia entre réplicas; L1 solo como fallback si KV no está disponible.
 */
export const globalRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const cleanPath = req.originalUrl.split('?')[0];

    // Páginas HTML públicas: límite global por IP vía KV (consistente entre réplicas)
    if (isPublicHtmlRoute(cleanPath, req.method)) {
        const count = await incrementPerMinuteCounter(`rl:pubhtml:${getSafeIp(req)}`);
        applyRateLimitHeaders(res, RATE_LIMITS.PUBLIC_HTML, count);

        if (count > RATE_LIMITS.PUBLIC_HTML) {
            logger.warn(`🛑 Public HTML rate limit exceeded for rl:pubhtml:${getSafeIp(req)} on ${cleanPath}`);
            return handleLimitExceeded(req, res, cleanPath);
        }

        return next();
    }

    // Rutas públicas restantes (assets, health, auth callback…): sin límite global
    if (isPublicRoute(cleanPath, req.method)) {
        return next();
    }

    try {
        const apiUser = res.locals?.apiUser;
        const userId = (req as AuthenticatedRequest).userId;
        const isApiKeyRequest = res.locals?.isApiKeyRequest;

        // Determinar el identificador único (Key) y el límite
        let key = '';
        let limit = 0;

        if (apiUser && isApiKeyRequest) {
            key = `rl:api:${apiUser.userId}`;
            limit = resolveUserRateLimit(apiUser);
        } else if (userId) {
            key = `rl:sess:${userId}`;
            limit = apiUser ? Math.max(RATE_LIMITS.DASHBOARD, resolveUserRateLimit(apiUser) * 10) : RATE_LIMITS.DASHBOARD;
        } else {
            const safeIp = getSafeIp(req);
            key = `rl:ip:${safeIp}`;
            limit = RATE_LIMITS.PUBLIC;
        }

        if (!isKvWriteAvailable()) {
            return next();
        }

        const currentWindow = Math.floor(Date.now() / 60000);
        const redisKey = `twitch_api:${key}:${currentWindow}`;

        // Pipeline atómico: INCR + EXPIRE en un solo round-trip a Redis
        const [count] = (await kv.pipeline().incr(redisKey).expire(redisKey, 60).exec()) as [
            number,
            number
        ];

        applyRateLimitHeaders(res, limit, count);

        if (count > limit) {
            logger.warn(`🛑 Rate limit exceeded for ${key} on ${cleanPath}`);
            return handleLimitExceeded(req, res, cleanPath);
        }

        next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('KV rate limit omitido en desarrollo', { error });
            return next();
        }

        logger.error('Error in KV Rate Limiter:', error);
        return res.status(503).json({ error: 'Service Unavailable', message: 'Servicio temporalmente no disponible' });
    }
};

/**
 * Maneja la respuesta cuando se excede el límite.
 */
async function handleLimitExceeded(req: Request, res: Response, cleanPath: string) {
    const message = MESSAGES.AUTH.RATE_LIMIT_EXCEEDED;

    if (typeof req.headers.accept === 'string' && req.headers.accept.includes('text/html')) {
        return res.redirect(302, rateLimitPagePath(60_000));
    }

    if (isBotCommand(cleanPath)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(429).send('');
    }

    if (isApiRoute(cleanPath)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(429).send(message);
    }

    res.status(429).json({ error: 'Too Many Requests', message });
}

/**
 * Limitador específico para endpoints pesados (clips, etc).
 */
export const heavyRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    // Solo aplica para peticiones con API Key externa
    if (!res.locals?.isApiKeyRequest) return next();

    const apiUser = res.locals?.apiUser;
    if (!apiUser) return next();

    const key = `rl:heavy:${apiUser.userId}`;
    const limit = RATE_LIMITS.HEAVY;
    const currentWindow = Math.floor(Date.now() / 60000);

    try {
        let count: number;
        if (!isKvWriteAvailable()) {
            return next();
        } else {
            const redisKey = `twitch_api:${key}:${currentWindow}`;
            const [n] = (await kv.pipeline().incr(redisKey).expire(redisKey, 60).exec()) as [
                number,
                number
            ];
            count = n;
        }

        if (count > limit) {
            res.setHeader('Content-Type', 'text/plain');
            return res
                .status(429)
                .send(`Límite de peticiones pesadas excedido (max ${RATE_LIMITS.HEAVY}/min).`);
        }
        next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('KV heavy rate limit omitido en desarrollo', { error });
            return next();
        }

        logger.error('Error in Heavy Rate Limiter:', error);
        return res.status(503).json({ error: 'Service Unavailable', message: 'Servicio temporalmente no disponible' });
    }
};

/**
 * Limitador para intentos de login (Fuerza Bruta).
 */
/**
 * Limitador para revelar API Key en el panel (auditoría / abuso).
 */
export const revealKeyRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const apiUser = res.locals?.apiUser as { userId?: string } | undefined;
    const userId = apiUser?.userId;
    if (!userId) return next();

    const key = `rl:reveal-key:${userId}`;
    const limit = RATE_LIMITS.REVEAL_API_KEY;
    const currentWindow = Math.floor(Date.now() / 60000);

    if (!isKvWriteAvailable()) {
        return next();
    }

    try {
        const redisKey = `twitch_api:${key}:${currentWindow}`;
        const [count] = (await kv.pipeline().incr(redisKey).expire(redisKey, 60).exec()) as [
            number,
            number
        ];

        if (count > limit) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Demasiados intentos de revelar la API Key. Espera un momento.'
            });
        }
        return next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('KV reveal-key rate limit omitido en desarrollo', { error });
            return next();
        }

        logger.error('Error in Reveal Key Rate Limiter:', error);
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Servicio temporalmente no disponible'
        });
    }
};

export const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const safeIp = (req.ip || 'anon').replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);
    const key = `rl:auth:${safeIp}`;
    const limit = RATE_LIMITS.LOGIN;
    const windowSeconds = 5 * 60;
    const redisKey = `twitch_api:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

    if (!isKvWriteAvailable()) {
        return next();
    }

    try {
        const [count] = (await kv
            .pipeline()
            .incr(redisKey)
            .expire(redisKey, windowSeconds)
            .exec()) as [number, number];

        if (count > limit) {
            if (
                typeof req.headers.accept === 'string' &&
                req.headers.accept.includes('text/html')
            ) {
                return res.redirect(302, rateLimitPagePath(windowSeconds * 1000));
            }
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 5 minutos.'
            });
        }
        next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            logger.debug('KV auth rate limit omitido en desarrollo', { error });
            return next();
        }

        logger.error('Error in Auth Rate Limiter:', error);
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Servicio de autenticación no disponible por alta carga global.'
        });
    }
};
