import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Middleware que genera un nonce criptográfico único solo para requests que sirven HTML
export const cspNonce = (req: Request, res: Response, next: NextFunction): void => {
    // Solo generar nonce para páginas HTML (no API calls ni assets estáticos)
    const isHtmlRequest =
        !req.path.startsWith('/api/') &&
        !req.path.startsWith('/twitch/') &&
        !req.path.startsWith('/auth') &&
        !/\.(css|js|json|png|jpg|jpeg|gif|webp|ico|svg|woff2?|map)$/i.test(req.path);

    res.locals.cspNonce = isHtmlRequest ? crypto.randomBytes(16).toString('base64') : '';
    next();
};
