import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import { MESSAGES } from '../../core/config/messages';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString } from '../../core/utils/validationHelpers';
import { withTwitchAuth } from '../../core/utils/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import { fillTemplate } from './commandTemplates';

export const getShoutout = async (req: AuthenticatedRequest, res: Response) => {
    const touser = safeString(req.query.touser);
    let sanitizedUser = safeString(req.query.user);
    if (sanitizedUser?.includes('$(') || sanitizedUser?.includes('${')) sanitizedUser = 'Anónimo';

    const result = await trackRequest(
        req.userId,
        {
            type: 'shoutout',
            user: sanitizedUser || 'Anónimo',
            metadata: { target: touser },
            incrementStat: 'so'
        },
        async () => {
            const apiResult = await withTwitchAuth(
                req,
                res,
                async (token: string) => {
                    const targetUserId = await apiService.getUserId(touser, token);
                    const channelInfo = await apiService.getChannelInfo(targetUserId, token);
                    const gameName = channelInfo.game_name || 'Just Chatting';
                    const url = `https://twitch.tv/${touser}`;

                    const rawPattern =
                        safeString(req.query.template) || MESSAGES.COMMANDS.SHOUTOUT_HEADLINE;
                    const message = fillTemplate(rawPattern, {
                        user: touser,
                        game: gameName,
                        url
                    });

                    return message;
                },
                'SHOUTOUT'
            );

            return apiResult;
        },
        req
    );

    if (result) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        return res.send(result);
    }
    if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        return res.send('No se pudo generar el shoutout. Intenta de nuevo.');
    }
};
