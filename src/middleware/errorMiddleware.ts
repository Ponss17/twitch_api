import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: { status?: number; message?: string },
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('❌ [Error Handler]:', err);

    const status = err.status || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(status).json({
        error: true,
        status,
        message,
        timestamp: new Date().toISOString()
    });
};

export const logger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
};
