import { Request, Response, NextFunction } from 'express';
import { kv } from '@vercel/kv';
import { RATE_LIMITS } from '../config/limits';
import { MESSAGES } from '../config/messages';
import { isPublicRoute, isApiRoute } from '../utils/routeHelpers';
import { AuthenticatedRequest } from '../../types/twitch';
import { logger } from '../utils/logger';
import { serveHtml } from '../utils/serveHtml';

/**
 * Middleware de Rate Limiting Global usando Vercel KV (Redis).
 * Esto asegura que los límites sean consistentes en todas las instancias Serverless.
 */
export const globalRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const cleanPath = req.originalUrl.split('?')[0];

    // 1. Excepciones para rutas públicas (Alta disponibilidad)
    if (isPublicRoute(cleanPath)) {
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
            limit = apiUser.customRateLimit || RATE_LIMITS.DEFAULT;
        } else if (userId) {
            key = `rl:sess:${userId}`;
            limit = RATE_LIMITS.DASHBOARD;
        } else {
            const safeIp = (req.ip || 'anon').replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);
            key = `rl:ip:${safeIp}`;
            limit = RATE_LIMITS.PUBLIC;
        }

        const currentWindow = Math.floor(Date.now() / 60000); // Ventana de 1 minuto
        const redisKey = `${key}:${currentWindow}`;

        // Incrementar el contador en Redis
        const count = await kv.incr(redisKey);
        if (count === 1) {
            await kv.expire(redisKey, 60); // Caduca en 1 minuto
        }

        // Añadir headers estándares de Rate Limit
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

        if (count > limit) {
            logger.warn(`🛑 Rate limit exceeded for ${key} on ${cleanPath}`);
            return handleLimitExceeded(req, res, cleanPath);
        }

        next();
    } catch (error) {
        logger.error('Error in KV Rate Limiter:', error);

        // En desarrollo, si falla Redis permitimos el paso para no bloquear el trabajo local
        if (process.env.NODE_ENV !== 'production') {
            logger.warn('⚠️ KV offline: Saltando rate limit global en desarrollo');
            return next();
        }

        if (isApiRoute(cleanPath)) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(503).send('Servicio temporalmente no disponible (KV Timeout).');
        }
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Servicio no disponible debido a alta carga global.'
        });
    }
};

/**
 * Maneja la respuesta cuando se excede el límite.
 */
async function handleLimitExceeded(req: Request, res: Response, cleanPath: string) {
    const message = MESSAGES.AUTH.RATE_LIMIT_EXCEEDED;

    if (typeof req.headers.accept === 'string' && req.headers.accept.includes('text/html')) {
        return await serveHtml(res, 'public/429.html', 429);
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
    const redisKey = `${key}:${Math.floor(Date.now() / 60000)}`;

    try {
        const count = await kv.incr(redisKey);
        if (count === 1) await kv.expire(redisKey, 60);

        if (count > limit) {
            res.setHeader('Content-Type', 'text/plain');
            return res
                .status(429)
                .send(`Límite de peticiones pesadas excedido (max ${RATE_LIMITS.HEAVY}/min).`);
        }
        next();
    } catch (error) {
        logger.error('Error in Heavy Rate Limiter:', error);

        if (process.env.NODE_ENV !== 'production') {
            logger.warn('⚠️ KV offline: Saltando heavy rate limit en desarrollo');
            return next();
        }

        res.setHeader('Content-Type', 'text/plain');
        return res.status(503).send('Servicio temporalmente intermitente.');
    }
};

/**
 * Limitador para intentos de login (Fuerza Bruta).
 */
export const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const safeIp = (req.ip || 'anon').replace(/[^a-zA-Z0-9.:]/g, '').slice(0, 45);
    const key = `rl:auth:${safeIp}`;
    const limit = RATE_LIMITS.LOGIN;
    const windowSeconds = 5 * 60; // 5 minutos
    const redisKey = `${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

    try {
        const count = await kv.incr(redisKey);
        if (count === 1) await kv.expire(redisKey, windowSeconds);

        if (count > limit) {
            if (
                typeof req.headers.accept === 'string' &&
                req.headers.accept.includes('text/html')
            ) {
                return await serveHtml(res, 'public/429.html', 429);
            }
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
            });
        }
        next();
    } catch (error) {
        logger.error('Error in Auth Rate Limiter:', error);

        if (process.env.NODE_ENV !== 'production') {
            logger.warn('⚠️ KV offline: Saltando auth rate limit en desarrollo');
            return next();
        }

        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Servicio de autenticación no disponible por alta carga global.'
        });
    }
};
