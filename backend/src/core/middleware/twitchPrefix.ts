import { Request, Response, NextFunction } from 'express';

/**
 * Compat legacy: Vercel reescribe /twitch/* → Express, pero los routers viven en / y /api.
 * Elimina el prefijo /twitch para que /twitch/followage resuelva como /followage.
 */
export const stripTwitchPrefix = (req: Request, _res: Response, next: NextFunction): void => {
    const path = req.path;
    if (path === '/twitch' || path.startsWith('/twitch/')) {
        const stripped = path.replace(/^\/twitch/, '') || '/';
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        req.url = stripped + qs;
    }
    next();
};
