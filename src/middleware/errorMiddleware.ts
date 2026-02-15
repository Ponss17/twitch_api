import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: { status?: number; message?: string },
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error('❌ [Error Handler]:', err);

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';

    if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
        return res.status(status).send(message);
    }

    if (req.accepts('html')) {
        if (status === 404) {
            return res.status(404).sendFile('404.html', { root: './public' });
        }
        return res
            .status(status)
            .send(`<h1>Error ${status}</h1><p>${message}</p><a href="/">Volver</a>`);
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
        logger.info(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
};
