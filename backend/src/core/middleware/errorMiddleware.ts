import { Request, Response, NextFunction } from 'express';
import { logger, clearRequestId, getRequestId, asyncContext } from '../utils/logger';

import { isBotCommand, isApiRoute, isJsonApiRoute } from '../utils/routeHelpers';
import { frontendPagePath, rateLimitPagePath } from '../utils/frontendPaths';
import { jsonError } from '../utils/jsonResponse';
import { redactSensitiveUrl } from '../utils/redactSensitiveUrl';

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

    if (isJsonApiRoute(req.path)) {
        return jsonError(res, status, message);
    }

    if (isApiRoute(req.path)) {
        return res.status(status).send(message);
    }

    if (req.accepts('html')) {
        if (status === 404) {
            return res.redirect(302, frontendPagePath('/404'));
        }
        if (status === 429) {
            return res.redirect(302, rateLimitPagePath(60_000));
        }
        return res.redirect(302, frontendPagePath('/500'));
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
 * En Vercel (VERCEL=1) logea todas las peticiones API con detalle para el dashboard de logs.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    // Skip completo para assets estáticos: no gastar CPU en logging para .css, .js, imágenes, etc.
    if (/\.(webp|png|jpg|jpeg|gif|css|js|ico|svg|woff2?|map|json)$/i.test(req.path)) {
        return next();
    }

    const verboseRequests =
        process.env.LOG_VERBOSE === '1' || process.env.LOG_LEVEL === 'debug';

    asyncContext.run(new Map(), () => {
        const start = Date.now();

        const requestId = logger.startRequest(req.method, req.path);
        res.locals.requestId = requestId;

        if (verboseRequests) {
            const safeUrl = redactSensitiveUrl(req.originalUrl);
            logger.info(`→ ${req.method} ${safeUrl}`, {
                requestId,
                method: req.method,
                endpoint: safeUrl,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('user-agent')?.slice(0, 160),
                vercelId: req.get('x-vercel-id'),
                region: process.env.VERCEL_REGION
            });
        }

        res.on('finish', () => {
            const duration = Date.now() - start;
            const safeUrl = redactSensitiveUrl(req.originalUrl);
            const userId = (req as unknown as { user?: { id?: string } }).user?.id;
            const meta = {
                requestId,
                method: req.method,
                endpoint: safeUrl,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                userId,
                ip: req.ip,
                userAgent: req.get('user-agent')?.slice(0, 160),
                vercelId: req.get('x-vercel-id'),
                region: process.env.VERCEL_REGION,
                contentLength:
                    typeof res.getHeader === 'function'
                        ? res.getHeader('content-length')
                        : undefined
            };

            if (res.statusCode >= 500) {
                logger.error(`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, meta);
            } else if (res.statusCode >= 400) {
                logger.warn(`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, meta);
            } else if (verboseRequests) {
                logger.info(`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, meta);
            }

            clearRequestId();
        });

        next();
    });
};
