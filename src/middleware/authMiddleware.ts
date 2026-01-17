import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

import * as authService from '../services/authService';
import * as apiService from '../services/apiService';
import { MESSAGES } from '../config/messages';

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const safeString = (val: unknown) => (typeof val === 'string' ? val : '');

    let token = safeString(req.query.token) || safeString(req.body?.token);
    const apiKey = safeString(req.query.apiKey) || safeString(req.body?.apiKey);

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (apiKey) {
        try {
            const authData = await authService.getValidToken(apiKey);
            token = authData.accessToken;
            req.userId = authData.userId;
        } catch (error: any) {
            console.error('Middleware Auth Error (API Key lookup):', error.message);
            return res.status(401).send(MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    if (!token) {
        return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
    }

    if (!req.userId) {
        try {
            const validation = await apiService.validateToken(token);
            if (validation && validation.user_id) {
                req.userId = validation.user_id;
            }
        } catch (e) {
            console.warn('Error Middleware Auth: Could not validate token to extract userId');
        }
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
