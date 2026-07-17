import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/twitch';
import { AppError, isAuthenticationError } from '../errors/AppError';
import { isPublicRoute, isApiRoute, isJsonApiRoute } from '../utils/routeHelpers';
import { jsonError } from '../utils/jsonResponse';
import { blockIfUnauthorizedScanExceeded } from './redisRateLimiter';

export type CookieResolveResult =
    | { status: 'ok'; user: import('../../types/twitch').StoredUser }
    | { status: 'missing' }
    | { status: 'transient' };

export function isAuthCookieError(error: unknown): boolean {
    if (error instanceof AppError) return error.statusCode === 401;
    return isAuthenticationError(error);
}

export function isTransientCookieError(error: unknown): boolean {
    if (isAuthCookieError(error)) return false;
    const message = (error as Error).message ?? '';
    return (
        message.includes('fetch failed') ||
        message.includes('ECONN') ||
        message.includes('ETIMEDOUT') ||
        message.includes('timeout') ||
        message.includes('network')
    );
}

export function respondSessionUnavailable(res: Response, req: AuthenticatedRequest): Response {
    if (isJsonApiRoute(req.path)) {
        return jsonError(res, 503, 'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.', {
            code: 'SERVICE_UNAVAILABLE',
            details: { offline: true }
        });
    }
    if (isApiRoute(req.path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res
            .status(503)
            .send('Servicio de autenticación no disponible. Intenta de nuevo.');
    }
    return jsonError(res, 503, 'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.', {
        code: 'SERVICE_UNAVAILABLE',
        details: { offline: true }
    });
}

export function rejectInactiveUser(res: Response, path: string): Response {
    if (isJsonApiRoute(path)) {
        return jsonError(res, 403, 'Cuenta suspendida.', { code: 'ACCOUNT_SUSPENDED' });
    }
    if (isApiRoute(path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send('Cuenta suspendida.');
    }
    return jsonError(res, 403, 'Cuenta suspendida.', { code: 'ACCOUNT_SUSPENDED' });
}

export const requestPath = (req: AuthenticatedRequest) => req.originalUrl?.split('?')[0] || req.path;

export const rejectUnauthorized = async (
    req: AuthenticatedRequest,
    res: Response,
    respond: () => Response
): Promise<Response> => {
    if (await blockIfUnauthorizedScanExceeded(req, res, requestPath(req))) {
        return res;
    }
    return respond();
};

export function respondAuthServiceUnavailable(res: Response, path: string): Response {
    if (isJsonApiRoute(path)) {
        return jsonError(
            res,
            503,
            'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
            { code: 'SERVICE_UNAVAILABLE' }
        );
    }
    if (isApiRoute(path)) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(503).send('Servicio de autenticación no disponible. Intenta de nuevo.');
    }
    return jsonError(
        res,
        503,
        'No se pudo verificar la sesión. Intenta de nuevo en unos segundos.',
        { code: 'SERVICE_UNAVAILABLE' }
    );
}

export function isMissingTokenOnProtectedRoute(req: AuthenticatedRequest): boolean {
    return !isPublicRoute(req.path, req.method);
}
