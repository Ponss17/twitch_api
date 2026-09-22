import { Request, Response, NextFunction } from 'express';
import { jsonError } from '../utils/jsonResponse';
import { MESSAGES } from '../config/messages';

/**
 * Exige sesión de panel (cookie). Bloquea API key / Bearer / overlay
 * en rutas destructivas o de secretos.
 */
export function requireCookieSession(req: Request, res: Response, next: NextFunction): void {
    if (res.locals.isCookieSession === true && res.locals.authSource === 'cookie') {
        next();
        return;
    }

    jsonError(res, 403, MESSAGES.AUTH.COOKIE_SESSION_REQUIRED, {
        code: 'COOKIE_SESSION_REQUIRED'
    });
}
