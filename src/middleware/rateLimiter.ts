import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { MESSAGES } from '../config/messages';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request, res: Response) => {
        // 1. Prioridad: API Key VÁLIDA (Verificada en DB/Caché por middleware previo)
        if (res.locals && res.locals.apiUser) {
            return 120; // 2 req/seg
        }

        // 2. Excepciones de Sistema
        if (
            req.path.includes('/auth') ||
            req.path.includes('/callback') ||
            req.path.includes('/health')
        ) {
            return 30;
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

        // 4. Bloqueo Total (Anónimos o Key Falsa)
        return 0;
    },
    keyGenerator: (req: Request, res: Response): string => {
        if (res.locals && res.locals.apiUser) {
            return req.query.apiKey as string;
        }
        return req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
        const message = MESSAGES.AUTH.INVALID_CREDENTIALS;

        // Si es una ruta de API o un bot de Twitch, enviar texto plano
        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(429).send(message);
        }

        // Para dashboard/web enviar JSON
        res.status(429).json({ error: 'Access Denied', message });
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false
});

export default limiter;
