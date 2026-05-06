import { Request, Response, NextFunction } from 'express';
import { logger, clearRequestId, getRequestId, asyncContext } from '../utils/logger';
import { Sentry } from '../utils/sentry';
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

    if (status >= 500) {
        Sentry.captureException(err);
    }

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
 * Middleware de logging estructurado para requests HTTP
 * Genera un ID de correlación único por request y logea información estructurada
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    asyncContext.run(new Map(), () => {
        const start = Date.now();

        const requestId = logger.startRequest(req.method, req.path);

        res.locals.requestId = requestId;

        const safeUrl = req.originalUrl.replace(
            /([?&])(apiKey|token|access_token|refresh_token)=([^&]*)/gi,
            '$1$2=[REDACTED]'
        );

        logger.info(`→ Request started`, {
            requestId,
            method: req.method,
            url: safeUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')?.slice(0, 100)
        });

        res.on('finish', () => {
            const duration = Date.now() - start;

            const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

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

            clearRequestId();
        });

        next();
    });
};
