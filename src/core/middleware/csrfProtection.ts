import { Request, Response, NextFunction } from 'express';
import { MESSAGES } from '../config/messages';
import { ALLOWED_ORIGINS } from '../config/origins';

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

    // Allow if origin matches an allowed domain
    if (origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed))) {
        return next();
    }

    // Fallback: check referer
    if (referer && ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))) {
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

    return res.status(403).json({
        error: MESSAGES.SYSTEM.UNAUTHORIZED,
        message: 'Solicitud bloqueada por protección CSRF.'
    });
};
