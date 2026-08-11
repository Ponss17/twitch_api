import { Response } from 'express';
import * as dbService from '../../core/database/dbService';
import * as apiService from '../twitch/twitch.service';
import axios from 'axios';
import { CONFIG } from '../../core/config/env';
import { MESSAGES } from '../../core/config/messages';
import { logger } from '../../core/utils/logger';
import { jsonError } from '../../core/utils/jsonResponse';

import { AuthenticatedRequest } from '../../types/twitch';

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
    const { message, anonymous = false, identity } = req.body as {
        message: string;
        anonymous?: boolean;
        identity?: 'twitch' | 'discord';
    };
    const { userId, login, twitchToken } = req;

    const anonymousAvatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

    let username = MESSAGES.FEEDBACK.ANONYMOUS_USER;
    let avatar = anonymousAvatar;
    let userType = MESSAGES.FEEDBACK.VIEWER_ROLE;
    let identityLabel = MESSAGES.FEEDBACK.IDENTITY_ANONYMOUS;
    let idField = 'Anónimo';
    let accountField: string | null = null;

    if (!anonymous && (userId || login)) {
        try {
            let cachedUser = null;
            if (userId) {
                cachedUser = await dbService.getUser(userId);
            }

            const discordLinked = Boolean(cachedUser?.discordId);
            const wantDiscord = identity === 'discord';

            if (wantDiscord && !discordLinked) {
                return jsonError(res, 400, MESSAGES.FEEDBACK.DISCORD_NOT_LINKED, {
                    code: 'BAD_REQUEST'
                });
            }

            const useDiscord = wantDiscord && discordLinked;

            if (useDiscord && cachedUser?.discordId) {
                identityLabel = MESSAGES.FEEDBACK.IDENTITY_DISCORD;
                username = cachedUser.discordUsername || `Discord ${cachedUser.discordId}`;
                avatar = cachedUser.discordAvatar || anonymousAvatar;
                idField = cachedUser.discordId;
                accountField = login
                    ? `Twitch \`${login}\` (cuenta del panel)`
                    : null;
                if (cachedUser.role) {
                    userType = cachedUser.role.toUpperCase();
                }
            } else {
                identityLabel = MESSAGES.FEEDBACK.IDENTITY_TWITCH;
                username = login || MESSAGES.FEEDBACK.ANONYMOUS_USER;
                idField = userId || login || '—';

                if (cachedUser) {
                    username = cachedUser.displayName || cachedUser.login || username;
                    avatar = cachedUser.profileImageUrl || avatar;
                    if (cachedUser.role) {
                        userType = cachedUser.role.toUpperCase();
                    }
                } else if (twitchToken && login) {
                    const liveInfo = await apiService.getUserInfo(login, twitchToken);
                    if (liveInfo) {
                        username = liveInfo.display_name;
                        avatar = liveInfo.profile_image_url;
                    }
                }
            }
        } catch (e) {
            logger.error('Error identifying user for feedback:', e);
        }
    }

    if (!CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL) {
        return jsonError(res, 500, MESSAGES.SYSTEM.INTERNAL_CONFIG_ERROR, {
            code: 'INTERNAL_ERROR'
        });
    }

    try {
        const fields: { name: string; value: string; inline?: boolean }[] = [
            {
                name: '🪪 Identidad',
                value: identityLabel,
                inline: true
            },
            {
                name: anonymous ? '🆔 Usuario' : '🆔 ID',
                value: idField,
                inline: true
            }
        ];

        if (!anonymous) {
            fields.push({ name: '🏷️ Rango', value: userType, inline: true });
        }
        if (accountField) {
            fields.push({ name: '🔗 Cuenta', value: accountField, inline: false });
        }
        fields.push({ name: '📝 Mensaje', value: message, inline: false });

        await axios.post(CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL, {
            username: username.slice(0, 80),
            avatar_url: avatar,
            embeds: [
                {
                    title: MESSAGES.FEEDBACK.EMBED_TITLE,
                    color: anonymous ? 0x71717a : identityLabel === MESSAGES.FEEDBACK.IDENTITY_DISCORD ? 0x5865f2 : 0x9146ff,
                    fields,
                    footer: { text: MESSAGES.FEEDBACK.EMBED_FOOTER },
                    timestamp: new Date().toISOString()
                }
            ]
        });

        res.json({ success: true, message: MESSAGES.FEEDBACK.SUCCESS });
    } catch (error) {
        logger.error('Error enviando feedback a Discord:', error);
        return jsonError(res, 500, MESSAGES.FEEDBACK.SEND_ERROR, { code: 'INTERNAL_ERROR' });
    }
};
