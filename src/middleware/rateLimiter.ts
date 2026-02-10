import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

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
    message: {
        error: 'Access Denied',
        message: 'Se requiere una API Key válida para usar este servicio.'
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
