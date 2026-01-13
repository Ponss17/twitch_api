import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

import * as authService from '../services/authService';

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const safeString = (val: unknown) => (typeof val === 'string' ? val : '');

    // Debug Log
    console.log(`[AuthMiddleware] Method: ${req.method} | URL: ${req.originalUrl}`);
    console.log('Query:', req.query);
    console.log('Body:', req.body);

    let token = safeString(req.query.token) || safeString(req.body?.token);
    const apiKey = safeString(req.query.apiKey) || safeString(req.body?.apiKey);

    if (apiKey) {
        try {
            token = await authService.getValidToken(apiKey);
        } catch (error: any) {
            console.error('Middleware Auth Error (API Key lookup):', error.message);
            return res.status(401).send('⛔ Error: Credenciales inválidas. Verifica tu API Key.');
        }
    }

    if (!token) {
        return res.status(401).send('Error: Token no proporcionado. Debes incluir ?token=TU_TOKEN en la URL.');
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
