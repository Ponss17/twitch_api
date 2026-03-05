import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import * as authService from '../../features/auth/auth.service';

interface TwitchApiError extends Error {
    status?: number;
    response?: {
        status?: number;
    };
}

export const withTwitchAuth = async <T>(
    req: Request & { twitchToken?: string },
    res: Response,
    action: (token: string) => Promise<T>,
    context: string
): Promise<T | null> => {
    let token = req.twitchToken;
    const apiKey = (req.query.apiKey as string) || (req.headers['x-api-key'] as string);

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        attempts++;
        try {
            return await action(token || '');
        } catch (error: unknown) {
            const err = error as TwitchApiError;
            const is401 =
                err.message?.includes('401') || err.status === 401 || err.response?.status === 401;

            if (is401 && apiKey && attempts < maxAttempts) {
                logger.warn(`[${context}] 401 detected (attempt ${attempts}), forcing refresh...`);
                try {
                    const authData = await authService.getValidToken(apiKey);
                    token = authData.accessToken;
                    continue;
                } catch (refreshErr) {
                    logger.error(`[${context}] Forced refresh failed:`, refreshErr);
                }
            }

            const status = err.status || err.response?.status || 500;
            const message = status === 404 ? err.message : 'Error processing Twitch request';

            logger.error(`[${context} ERROR]`, { attempt: attempts, error });

            if (!res.headersSent) {
                if (is401) {
                    res.status(401).send('Error de autenticación. Token expirado.');
                } else {
                    res.status(status).send(message);
                }
            }
            return null;
        }
    }
    return null;
};
