import { Response } from 'express';

import * as apiService from '../twitch/twitch.service';
import { logger } from '../../core/utils/logger';
import { AuthenticatedRequest } from '../../types/twitch';
import { safeString, sanitizeHtml } from '../../core/utils/validationHelpers';
import { withTwitchAuth } from '../auth/twitchAuthHelpers';
import { trackRequest } from '../../core/utils/tracking';
import * as dbService from '../../core/database/dbService';
import { fillTemplate } from './commandTemplates';
import { timedCall, timedHandler } from '../../core/utils/timing';

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    await timedHandler('createClip', req, async () => {
        const input = req.method === 'POST' ? req.body : req.query;
        const channel = safeString(input.channel);
        const userId = req.userId;
        let customTitle = safeString(input.q) || safeString(input.title);
        if (
            customTitle === '[invalid variable]' ||
            customTitle === 'null' ||
            customTitle === 'undefined' ||
            customTitle?.includes('$(') ||
            customTitle?.includes('${')
        ) {
            customTitle = '';
        }

        const result = await trackRequest(
            userId,
            {
                type: 'clip',
                user: safeString(input.user) || req.displayName || 'Streamer',
                incrementStat: 'clips',
                skipActivityLog: true
            },
            async () => {
                let finalTitle = customTitle;

                const [clipUrl] = await timedCall('createClip:twitchHelix', () =>
                    withTwitchAuth(
                        req,
                        res,
                        async (token: string) => {
                            if (!finalTitle) {
                                try {
                                    const [broadcasterId] = await timedCall('createClip:getUserId', () =>
                                        apiService.getUserId(channel, token)
                                    );
                                    const [channelInfo] = await timedCall('createClip:getChannelInfo', () =>
                                        apiService.getChannelInfo(broadcasterId, token)
                                    );
                                    finalTitle = channelInfo.title || 'Clip de ' + channel;
                                } catch (error) {
                                    logger.warn('Could not fetch stream title for clip fallback:', error);
                                    finalTitle = 'Clip de ' + channel;
                                }
                            }

                            return await apiService.createClip(channel, token, finalTitle);
                        },
                        'create-clip'
                    )
                );

                if (userId) {
                    let chatter = safeString(input.user) || req.displayName || 'Streamer';
                    if (chatter.includes('$(') || chatter.includes('${')) chatter = 'Anónimo';
                    await dbService.addUserActivity(userId, {
                        type: 'clip',
                        user: chatter,
                        metadata: { title: finalTitle, url: clipUrl, response: clipUrl }
                    });
                }

                if (clipUrl) {
                    const rawTemplate = safeString(input.template);
                    if (rawTemplate) {
                        const safeUrl = sanitizeHtml(clipUrl);
                        const safeChannel = sanitizeHtml(channel);
                        const safeTitle = sanitizeHtml(finalTitle || '');
                        let safeUser = safeString(input.user) || req.displayName || 'Streamer';
                        if (safeUser.includes('$(') || safeUser.includes('${')) safeUser = 'Anónimo';
                        safeUser = sanitizeHtml(safeUser);
                        return fillTemplate(rawTemplate, {
                            user: safeUser,
                            url: safeUrl,
                            channel: safeChannel,
                            title: safeTitle
                        });
                    }
                    return clipUrl;
                }
                return null;
            },
            req
        );

        if (result) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(result);
            return;
        }
        if (!res.headersSent) {
            res.status(204).send();
        }
    });
};

