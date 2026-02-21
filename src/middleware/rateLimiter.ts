import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { MESSAGES } from '../config/messages';
import { isPublicRoute } from '../utils/routeHelpers';
import { AuthenticatedRequest } from '../types/twitch';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request) => {
        const apiUser = req.res?.locals?.apiUser;

        // 1. Prioridad: Usuario Identificado (API Key o Sesión del Dashboard)
        if (apiUser) {
            return apiUser.customRateLimit || 120;
        }

        // 2. Sesión autenticada (Bearer token / Dashboard)
        const userId = (req as AuthenticatedRequest).userId;
        if (userId) {
            return 120;
        }

        // 3. Excepciones de Sistema / Estáticos (Alta disponibilidad)
        const path = req.originalUrl.split('?')[0];
        if (isPublicRoute(path)) {
            return 1000;
        }

        // 4. Bots Confiables
        const ua = req.get('user-agent') || '';
        if (
            ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Streamlabs') ||
            ua.includes('Moobot') ||
            ua.includes('Fossabot')
        ) {
            return 60;
        }

        // 5. Bloqueo Total (Peticiones anónimas a rutas protegidas)
        return 0;
    },
    keyGenerator: (req: Request): string => {
        const apiUser = req.res?.locals?.apiUser;
        const userId = (req as AuthenticatedRequest).userId;

        if (apiUser) {
            return (req.query.apiKey as string) || apiUser.userId;
        }
        if (userId) {
            return `sess:${userId}`;
        }
        // Usar ipKeyGenerator para manejo correcto de IPv6
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
    max: 100, // Aumentado de 10 a 100 para evitar bloqueos en pruebas
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false
});

export default limiter;
