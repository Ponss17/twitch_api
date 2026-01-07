import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
        const ua = req.get('User-Agent') || '';
        if (
            ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Fossabot') ||
            ua.includes('Wizebot') ||
            ua.includes('Mozilla')
        ) {
            return 500;
        }
        return 60;
    },
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export default limiter;
