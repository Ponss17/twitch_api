import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: { status?: number; statusCode?: number; message?: string },
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error('❌ [Error Handler]:', err);

    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';

    if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
        return res.status(status).send(message);
    }

    if (req.accepts('html')) {
        if (status === 404) {
            return res.status(404).sendFile('404.html', { root: './public' });
        }
        return res.status(status).sendFile('500.html', { root: './public' });
    }

    res.status(status).json({
        success: false,
        error: {
            code: status,
            message,
            timestamp: new Date().toISOString()
        }
    });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const safeUrl = req.originalUrl.replace(
            /([?&])(apiKey|token|access_token|refresh_token)=([^&]*)/gi,
            '$1$2=[REDACTED]'
        );
        logger.info(`[${req.method}] ${safeUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
};
