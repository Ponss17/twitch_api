import { Request, Response, NextFunction } from 'express';
import { jsonError } from '../utils/jsonResponse';
import { MESSAGES } from '../config/messages';
import { isBotCommandPath } from '../schemas/commandCatalog';

/**
 * Rutas de panel que una API key de Nightbot no debe leer ni mutar.
 * Los comandos de bot (followage, minijuegos, clips) siguen permitidos.
 */
const PANEL_PREFIXES = ['/dashboard', '/api/dashboard', '/system', '/api/system', '/alerts', '/api/alerts'];

/** Herramientas que el generador de comandos expone con API key bajo /dashboard. */
const API_KEY_DASHBOARD_ALLOW = ['/get-clips', '/chatters', '/clip-download'];

function cleanPath(path: string): string {
    return path.split('?')[0].replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

function isPanelRoute(path: string): boolean {
    const clean = cleanPath(path);
    if (clean.endsWith('/auth/logout')) return true;
    if (clean.endsWith('/auth/discord') || clean.includes('/auth/discord/')) {
        return !clean.endsWith('/discord/callback');
    }
    return PANEL_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
}

export function rejectApiKeyOnPanelRoutes(req: Request, res: Response, next: NextFunction): void {
    const apiKey = res.locals.authSource === 'apiKey' || res.locals.isApiKeyRequest === true;
    if (!apiKey) {
        next();
        return;
    }
    if (isBotCommandPath(req.path)) {
        next();
        return;
    }
    if (API_KEY_DASHBOARD_ALLOW.some((segment) => req.path.includes(segment))) {
        next();
        return;
    }
    if (!isPanelRoute(req.path)) {
        next();
        return;
    }

    jsonError(res, 403, MESSAGES.AUTH.API_KEY_SCOPE, { code: 'API_KEY_NOT_ALLOWED' });
}
