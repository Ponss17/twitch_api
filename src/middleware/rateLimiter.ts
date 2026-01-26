import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
        const ua = req.get('user-agent') || '';

        // Solo bots confiables obtienen límite alto
        if (ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Streamlabs') ||
            ua.includes('Moobot') ||
            ua.includes('StreamLabs')) {
            return 200;
        }

        // Usuarios normales (incluyendo navegadores)
        return 60;
    },
    message: { error: 'Demasiadas solicitudes, por favor intenta más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter estricto para rutas de autenticación
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Máximo 10 intentos por IP por hora
    message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en una hora.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export default limiter;
