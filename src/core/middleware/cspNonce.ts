import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Middleware que genera un nonce criptográfico único por request para la CSP
export const cspNonce = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
};
