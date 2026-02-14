import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { MESSAGES } from '../config/messages';
import { isPublicRoute } from '../utils/routeHelpers';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request) => {
        // 1. Prioridad: API Key VÁLIDA (Verificada en DB/Caché por middleware previo)
        if (req.res?.locals && req.res.locals.apiUser) {
            // Si el admin asignó un límite específico, usarlo. Si no, usar 120 (estándar).
            return req.res.locals.apiUser.customRateLimit || 120;
        }

        // 2. Excepciones de Sistema / Dashboard / Estáticos (Alta disponibilidad)
        const path = req.originalUrl.split('?')[0];
        if (isPublicRoute(path)) {
            return 1000; // Virtualmente sin límite para recursos estáticos y sistema
        }

        // 3. Bots Confiables
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

        // 4. Bloqueo Total (Comandos de chat sin ninguna credencial)
        return 0;
    },
    keyGenerator: (req: Request): string => {
        if (req.res?.locals && req.res.locals.apiUser) {
            return (req.query.apiKey as string) || req.res.locals.apiUser.userId;
        }
        // Usar ipKeyGenerator para manejo correcto de IPv6 en express-rate-limit v8
        return ipKeyGenerator(req.ip || 'unknown');
    },
    handler: (req: Request, res: Response) => {
        const cleanPath = req.originalUrl.split('?')[0];
        const isSystemRoute = isPublicRoute(cleanPath);

        let message = '⚠️ Has excedido el límite de peticiones. Por favor, espera un minuto.';

        // Si es un comando de chat (no sistema) y no hay usuario, es falta de Key
        if (!res.locals?.apiUser && !isSystemRoute) {
            message = MESSAGES.AUTH.INVALID_CREDENTIALS;
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
