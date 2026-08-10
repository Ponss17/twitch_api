import { Request, Response, NextFunction } from 'express';
import { jsonError } from '../utils/jsonResponse';
import type { OverlayReadPayload } from '../overlay/keys';
import type { StoredUser } from '../../types/twitch';

/** Sesión mínima para overlay — sin API key ni tokens OAuth. */
export function toOverlayApiUser(payload: OverlayReadPayload): StoredUser {
    return {
        userId: payload.userId,
        login: payload.login,
        displayName: payload.displayName,
        profileImageUrl: payload.profile_image_url,
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        obtainedAt: 0,
        isActive: true
    };
}

function normalizePath(req: Request): string {
    const raw = req.originalUrl?.split('?')[0] || req.path;
    return raw.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/** Overlay autenticado solo puede leer estado OBS vía GET. */
function isOverlayAllowedRoute(req: Request): boolean {
    if (req.method !== 'GET') return false;

    const path = normalizePath(req);
    return /^\/(?:api\/)?dashboard\/overlay-state\/(roulette|trends)$/.test(path);
}

/**
 * Restringe tokens overlay (X-Overlay-Token) a rutas de solo lectura del mirror OBS.
 * Debe ejecutarse después de apiKeyValidator y checkToken.
 */
export const overlayScopeGuard = (req: Request, res: Response, next: NextFunction): void => {
    if (!res.locals.isOverlayReadRequest) {
        return next();
    }

    if (isOverlayAllowedRoute(req)) {
        return next();
    }

    if (normalizePath(req).includes('/system/')) {
        return void jsonError(res, 403, 'Los tokens de overlay no pueden acceder al sistema.', {
            code: 'OVERLAY_READ_ONLY'
        });
    }

    return void jsonError(res, 403, 'Los tokens de overlay solo pueden leer el estado del overlay.', {
        code: 'OVERLAY_READ_ONLY'
    });
};
