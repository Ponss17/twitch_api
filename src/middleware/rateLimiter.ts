import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: (req: Request, res: Response) => {
        if (res.locals && res.locals.validApiKey) {
            return 120;
        }

        if (
            req.path.includes('/auth') ||
            req.path.includes('/callback') ||
            req.path.includes('/health')
        ) {
            return 30;
        }
        if (
            req.path.includes('/auth') ||
            req.path.includes('/callback') ||
            req.path.includes('/health')
        ) {
            return 30;
        }

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

        return 0;
    },
    keyGenerator: (req: Request, res: Response): string => {
        if (res.locals && res.locals.validApiKey) {
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
