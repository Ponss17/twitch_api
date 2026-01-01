import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
        const ua = req.get('User-Agent') || '';
        if (
            ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Mozilla') ||
            ua.includes('Chrome') ||
            ua.includes('Safari')
        ) {
            return 100;
        }
        return 20;
    },
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export default limiter;
