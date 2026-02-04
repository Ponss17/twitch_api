import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/twitch';
import * as authService from '../services/auth/authService';
import * as apiService from '../services/twitch/apiService';
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
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Middleware Auth Error (API Key lookup):', err.message);
            return res.status(401).send(MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    if (!token) {
        return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
    }

    if (!req.userId || !req.login) {
        try {
            const validation = await apiService.validateToken(token);
            if (validation) {
                if (validation.user_id) req.userId = validation.user_id;
                if (validation.login) req.login = validation.login;
            }
        } catch (_e) {
            console.warn('Error Middleware Auth: Could not validate token to extract user data');
        }
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
