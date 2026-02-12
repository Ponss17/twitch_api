import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/twitch';
import * as authService from '../services/auth/authService';
import * as apiService from '../services/twitch/apiService';
import * as dbService from '../services/infrastructure/dbService';
import { MESSAGES } from '../config/messages';
import { logger } from '../utils/logger';

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const safeString = (val: unknown) => (typeof val === 'string' ? val : '');

    if (res.locals.apiUser) {
        const user = res.locals.apiUser;
        req.userId = user.userId;
        req.login = user.login;
        req.twitchToken = user.accessToken;

        dbService.updateLastActive(user.userId).catch((err) => {
            logger.error('Error updating last active (pre-validated):', err);
        });

        return next();
    }

    let token = safeString(req.query.token) || safeString(req.body?.token);
    const apiKey =
        safeString(req.query.apiKey) ||
        safeString(req.body?.apiKey) ||
        safeString(req.headers['x-api-key']);

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
            logger.error('Middleware Auth Error (API Key lookup):', err.message);

            if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
                res.setHeader('Content-Type', 'text/plain');
                return res.status(401).send(MESSAGES.AUTH.INVALID_CREDENTIALS);
            }
            return res.status(401).json({ error: MESSAGES.AUTH.INVALID_CREDENTIALS });
        }
    }

    if (!token) {
        if (req.path.startsWith('/api') || req.path.startsWith('/twitch')) {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(401).send(MESSAGES.AUTH.MISSING_TOKEN_URL);
        }
        return res.status(401).json({ error: MESSAGES.AUTH.MISSING_TOKEN_URL });
    }

    if (!req.userId || !req.login) {
        try {
            const validation = await apiService.validateToken(token);
            if (validation) {
                if (validation.user_id) req.userId = validation.user_id;
                if (validation.login) req.login = validation.login;
            }
        } catch (_e) {
            logger.warn('Error Middleware Auth: Could not validate token to extract user data');
        }
    }

    if (req.userId) {
        dbService.updateLastActive(req.userId).catch((err: unknown) => {
            logger.error('Error updating last active:', err);
        });
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
