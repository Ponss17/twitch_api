import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import * as authService from '../services/auth/authService';

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
            const is401 =
                (error instanceof Error && error.message.includes('401')) ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.status === 401 ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error as any)?.response?.status === 401;

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

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const status = (error as any)?.status || 500;
            const message =
                status === 404
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (error as any)?.message
                    : 'Error processing Twitch request';

            logger.error(`[${context} ERROR]`, { attempt: attempts, error });

            // If it's the last attempt, send response
            if (!res.headersSent) {
                // Check if error is a known token error
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
