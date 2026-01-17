import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as dbService from '../services/dbService';
import * as apiService from '../services/apiService';
import axios from 'axios';
import { CONFIG } from '../config/env';
import { MESSAGES } from '../config/messages';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    if (!token) return res.status(401).send(MESSAGES.AUTH.NO_TOKEN);

    try {
        const validation = await apiService.validateToken(token);
        if (validation) {
            try {
                const userProfile = await apiService.getUserInfo(validation.login, token);
                return res.json({
                    valid: true,
                    user: {
                        id: userProfile.id,
                        login: userProfile.login,
                        display_name: userProfile.display_name,
                        profile_image_url: userProfile.profile_image_url
                    }
                });
            } catch (e) {
                return res.json({ valid: true, user: { login: validation.login } });
            }
        } else {
            return res.status(401).send(MESSAGES.AUTH.INVALID_TOKEN);
        }
    } catch (error: any) {
        return res.status(500).json({ error: MESSAGES.AUTH.VALIDATION_ERROR });
    }
};

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = safeString(req.body.key);
    if (!apiKey) return res.status(400).json({ error: MESSAGES.SYSTEM.KEY_REQUIRED });

    try {
        const user = await dbService.getUserByApiKey(apiKey);
        if (!user) return res.status(401).json({ error: MESSAGES.SYSTEM.USER_NOT_FOUND });

        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        console.error('Error regenerando key:', e);
        res.status(500).json({ error: MESSAGES.SYSTEM.REGENERATE_KEY_ERROR });
    }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
    const { message } = req.body;
    let { userId, twitchToken } = req;

    let username = 'Anónimo';
    let avatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
    let userType = '📺 Viewer';

    if (twitchToken) {
        try {
            const validation = await apiService.validateToken(twitchToken);
            if (validation) {
                if (!userId && validation.user_id) {
                    userId = validation.user_id;
                }

                const userProfile = await apiService.getUserInfo(validation.login, twitchToken);
                if (userProfile) {
                    username = userProfile.display_name;
                    avatar = userProfile.profile_image_url;

                    const typeMap: { [key: string]: string } = {
                        'partner': '🟣 Partner',
                        'affiliate': '🔵 Afiliado',
                        '': '📺 Viewer'
                    };
                    userType = typeMap[String(userProfile.broadcaster_type || '')] || '📺 Viewer';
                }
            }
        } catch (e) {
            console.error('Error getting full user profile for feedback', e);
        }
    }

    if (!message) {
        return res.status(400).json({ error: MESSAGES.FEEDBACK.MESSAGE_REQUIRED });
    }

    if (message.length > 2000) {
        return res.status(400).json({ error: MESSAGES.FEEDBACK.MESSAGE_TOO_LONG });
    }

    if (!CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL) {
        return res.status(500).json({ error: MESSAGES.SYSTEM.INTERNAL_CONFIG_ERROR });
    }

    try {
        await axios.post(CONFIG.DISCORD_FEEDBACK_WEBHOOK_URL, {
            username: username,
            avatar_url: avatar,
            embeds: [{
                title: "📢 Nuevo Feedback",
                color: 0x9146ff,
                fields: [
                    { name: "🆔 Usuario ID", value: userId || 'N/A', inline: true },
                    { name: "🏷️ Rango", value: userType, inline: true },
                    { name: "📝 Mensaje", value: message, inline: false }
                ],
                footer: { text: "LosPerris Twitch Api - FeedBack" },
                timestamp: new Date().toISOString()
            }]
        });

        res.json({ success: true, message: MESSAGES.FEEDBACK.SUCCESS });
    } catch (error) {
        console.error('Error enviando feedback a Discord:', error);
        res.status(500).json({ error: MESSAGES.FEEDBACK.SEND_ERROR });
    }
};
