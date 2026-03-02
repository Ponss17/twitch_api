import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { RATE_LIMITS } from '../config/limits';
import { MESSAGES } from '../config/messages';
import { isPublicRoute } from '../utils/routeHelpers';
import { AuthenticatedRequest } from '../types/twitch';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request, res: Response) => {
        const apiUser = res.locals?.apiUser;
        const isApiKeyRequest = res.locals?.isApiKeyRequest;

        // 1. Excepciones de Sistema / Estáticos (Alta disponibilidad)
        const path = req.originalUrl.split('?')[0];
        if (isPublicRoute(path)) {
            return RATE_LIMITS.PUBLIC;
        }

        // 2. Prioridad: Usuario con API Key (Llamada externa)
        if (isApiKeyRequest && apiUser) {
            return apiUser.customRateLimit || RATE_LIMITS.DEFAULT;
        }

        // 3. Sesión autenticada (Dashboard oficial)
        const userId = (req as AuthenticatedRequest).userId;
        if (userId) {
            return RATE_LIMITS.DASHBOARD;
        }

        // 4. Bloqueo Total (Peticiones no autorizadas)
        return 0;
    },
    keyGenerator: (req: Request, res: Response): string => {
        const apiUser = res.locals?.apiUser;
        const userId = (req as AuthenticatedRequest).userId;

        if (apiUser) {
            return (req.query.apiKey as string) || apiUser.userId;
        }
        if (userId) {
            return `sess:${userId}`;
        }
        return ipKeyGenerator(req.ip || 'unknown');
    },
    handler: (req: Request, res: Response) => {
        const cleanPath = req.originalUrl.split('?')[0];
        const isSystemRoute = isPublicRoute(cleanPath);

        let message = MESSAGES.AUTH.RATE_LIMIT_EXCEEDED;

        // Si no hay usuario identificado y no es ruta pública, es falta de API Key
        if (!res.locals?.apiUser && !isSystemRoute) {
            message = MESSAGES.AUTH.API_KEY_REQUIRED;
        }

        // Si es una ruta de API o un bot de Twitch, enviar texto plano
        if (cleanPath.startsWith('/api') || cleanPath.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(429).send(message);
        }

        // Si es navegador, mostrar página bonita
        if (req.accepts('html')) {
            return res.status(429).sendFile('429.html', { root: './public' });
        }

        // Para dashboard/web enviar JSON
        res.status(429).json({ error: 'Too Many Requests', message });
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: RATE_LIMITS.LOGIN * 4, // 20 intentos por hora
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false
});

export const heavyLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request, res: Response) => {
        // Solo aplica el límite reducido si es una petición con API Key externa
        // Si es una sesión del dashboard (userId en el request), no limitar extra
        const isApiKeyRequest = res.locals?.isApiKeyRequest;
        if (isApiKeyRequest) return RATE_LIMITS.HEAVY;
        return RATE_LIMITS.DASHBOARD;
    },
    keyGenerator: (req: Request, res: Response): string => {
        const apiUser = res.locals?.apiUser;
        if (apiUser) return `heavy:${(req.query.apiKey as string) || apiUser.userId}`;
        const userId = (req as AuthenticatedRequest).userId;
        return `heavy:sess:${userId || 'anon'}`;
    },
    handler: (_req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/plain');
        res.status(429).send(
            'Este endpoint es costoso. Máximo 10 peticiones por minuto con API Key.'
        );
    },
    standardHeaders: true,
    legacyHeaders: false
});

export default limiter;
