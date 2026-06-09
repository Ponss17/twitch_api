import { Request, Response, NextFunction } from 'express';
import { logger, clearRequestId, getRequestId, asyncContext } from '../utils/logger';

import { serveHtml } from '../utils/serveHtml';
import { isBotCommand, isApiRoute } from '../utils/routeHelpers';

export const errorHandler = async (
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

    // Limpiar requestId al finalizar
    clearRequestId();

    if (isBotCommand(req.path)) {
        res.setHeader('Content-Type', 'text/plain');
        const finalMsg =
            status >= 500 ? 'Error interno del servidor. Pide ayuda a Ponss 🦆' : message;
        return res.status(200).send(finalMsg);
    }

    if (isApiRoute(req.path)) {
        return res.status(status).send(message);
    }

    if (req.accepts('html')) {
        if (status === 404) {
            return await serveHtml(res, 'public/404.html', 404);
        }
        return await serveHtml(res, 'public/500.html', status);
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
 * Middleware de logging estructurado para requests HTTP.
 * Optimizado: omite logging para assets estáticos y solo logea errores al terminar.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    // Skip completo para assets estáticos: no gastar CPU en logging para .css, .js, imágenes, etc.
    if (/\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(req.path)) {
        return next();
    }

    asyncContext.run(new Map(), () => {
        const start = Date.now();

        const requestId = logger.startRequest(req.method, req.path);
        res.locals.requestId = requestId;

        // Solo logear al finalizar si hay error (4xx/5xx) para reducir CPU
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                const duration = Date.now() - start;
                const safeUrl = req.originalUrl.replace(
                    /([?&])(apiKey|token|access_token|refresh_token)=([^&]*)/gi,
                    '$1$2=[REDACTED]'
                );
                const logMethod = res.statusCode >= 500 ? logger.error : logger.warn;
                logMethod(`← Request completed: ${res.statusCode} in ${duration}ms`, {
                    requestId,
                    method: req.method,
                    endpoint: safeUrl,
                    statusCode: res.statusCode,
                    duration,
                    userId: (req as unknown as { user?: { id?: string } }).user?.id
                });
            }

            clearRequestId();
        });

        next();
    });
};
