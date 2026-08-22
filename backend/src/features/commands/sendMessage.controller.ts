import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { safeString } from '../../core/utils/validationHelpers';

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    const message = safeString(req.body?.message);
    const userId = req.userId;

    if (!userId) return res.status(401).send(MESSAGES.SYSTEM.USER_NOT_FOUND);
    if (!message || message.trim().length === 0 || message.length > 500) {
        return res.status(400).json({ error: 'Mensaje inválido o demasiado largo (máx. 500 caracteres).' });
    }

    const actorLogin =
        req.login ||
        req.displayName ||
        res.locals.apiUser?.login ||
        res.locals.apiUser?.displayName ||
        'Canal';

    const result = await trackRequest(
        userId,
        {
            type: 'message',
            user: actorLogin,
            metadata: { message: message },
            incrementStat: 'message'
        },
        async () => {
            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    await apiService.sendChatMessage(userId, userId, message, token);
                    return { success: true };
                },
                'SEND_MESSAGE'
            );

            return apiResult;
        },
        req
    );

    if (result) return res.json(result);
    if (!res.headersSent) return res.status(204).send();
};
