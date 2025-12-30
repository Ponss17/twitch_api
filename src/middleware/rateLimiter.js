const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
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

module.exports = limiter;
