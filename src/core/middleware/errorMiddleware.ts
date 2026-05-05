import { Request, Response, NextFunction } from 'express';
import { logger, clearRequestId, getRequestId } from '../utils/logger';
import { Sentry } from '../utils/sentry';

export const errorHandler = (
    err: {
        status?: number;
        statusCode?: number;
        message?: string;
        stack?: string;
        requestId?: string;
    },
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Agregar requestId al error si existe
    const requestId = getRequestId();
    if (requestId) {
        err.requestId = requestId;
    }

    logger.error('❌ [Error Handler]:', {
        requestId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';

    if (status >= 500) {
        Sentry.captureException(err);
    }

    // Limpiar requestId al finalizar
    clearRequestId();

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
            timestamp: new Date().toISOString(),
            requestId
        }
    });
};

/**
 * Middleware de logging estructurado para requests HTTP
 * Genera un ID de correlación único por request y logea información estructurada
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Generar y establecer ID de correlación para esta request
    const requestId = logger.startRequest(req.method, req.path);

    // Agregar requestId al objeto response para que esté disponible en controllers
    res.locals.requestId = requestId;

    // Sanitizar URL para no logear datos sensibles
    const safeUrl = req.originalUrl.replace(
        /([?&])(apiKey|token|access_token|refresh_token)=([^&]*)/gi,
        '$1$2=[REDACTED]'
    );

    // Log de inicio de request
    logger.info(`→ Request started`, {
        requestId,
        method: req.method,
        url: safeUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')?.slice(0, 100)
    });

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Determinar nivel de log basado en status code
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        // Log estructurado de la respuesta
        const logMethod =
            level === 'error' ? logger.error : level === 'warn' ? logger.warn : logger.info;
        logMethod(`← Request completed: ${res.statusCode} in ${duration}ms`, {
            requestId,
            method: req.method,
            endpoint: safeUrl,
            statusCode: res.statusCode,
            duration,
            userId: (req as unknown as { user?: { id?: string } }).user?.id
        });

        // Limpiar requestId del contexto
        clearRequestId();
    });

    next();
};
