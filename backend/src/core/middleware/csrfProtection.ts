import { Request, Response, NextFunction } from 'express';
import { ALLOWED_ORIGINS } from '../config/origins';
import { jsonError } from '../utils/jsonResponse';

/**
 * CSRF protection for state-changing routes.
 * Validates Origin/Referer header to prevent cross-site requests.
 * Only applies to POST/PUT/DELETE/PATCH methods.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();

    // Only check state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next();
    }

    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';

    // Extrae el origin (scheme + host + port) de una URL; null si no es válida.
    const toOrigin = (value: string): string | null => {
        try {
            return new URL(value).origin;
        } catch {
            return null;
        }
    };

    // Allow if origin matches an allowed domain (comparación EXACTA de origin para
    // evitar bypass por prefijo, p.ej. https://www.losperris.dev.evil.com).
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return next();
    }

    // Fallback: check referer (parseando su origin, nunca por prefijo de string)
    const refererOrigin = referer ? toOrigin(referer) : null;
    if (refererOrigin && ALLOWED_ORIGINS.includes(refererOrigin)) {
        return next();
    }

    // If no origin/referer, it may be a direct API call (e.g. curl, bot)
    // Allow if the request has a valid Bearer token (API calls from bots/scripts)
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return next();
    }

    // Allow API key in query (bots like Nightbot send this way) ONLY if there is no browser origin/referer
    if ((req.query.apiKey || req.headers['x-api-key']) && !origin && !referer) {
        return next();
    }

    return jsonError(res, 403, 'Solicitud bloqueada por protección CSRF.', { code: 'FORBIDDEN' });
};
