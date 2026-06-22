import { TwitchChannelInfo } from '../../types/twitch';
import { TwitchApiError } from '../../core/errors/AppError';
import * as cacheService from '../../core/database/cacheService';
import { apiClient, handleTwitchError, getHeaders } from './twitchClient';

export const getChannelInfo = async (
    broadcasterId: string,
    token: string
): Promise<TwitchChannelInfo> => {
    const cacheKey = `twitch:channel:${broadcasterId}`;
    try {
        const cachedResult = (await cacheService.get(cacheKey)) as TwitchChannelInfo | null;
        if (cachedResult) return cachedResult;

        const headers = getHeaders(token);
        const response = await apiClient.get(
            `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
            { headers }
        );

        if (response.data.data.length === 0) {
            throw new TwitchApiError('No se encontró información del canal.', 404);
        }

        const data = response.data.data[0];
        await cacheService.set(cacheKey, data, 1800);

        return data;
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getChannelInfo(${broadcasterId})`);
    }
};

export const sendChatMessage = async (
    broadcasterId: string,
    senderId: string,
    message: string,
    token: string
) => {
    try {
        await apiClient.post(
            'https://api.twitch.tv/helix/chat/messages',
            {
                broadcaster_id: broadcasterId,
                sender_id: senderId,
                message: message
            },
            {
                headers: {
                    ...getHeaders(token),
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        return handleTwitchError(error, `sendChatMessage(${broadcasterId})`);
    }
};

export const getChatters = async (
    broadcasterId: string,
    moderatorId: string,
    token: string
): Promise<{ user_id: string; user_login: string; user_name: string }[]> => {
    const cacheKey = `cache:chatters:${broadcasterId}`;
    try {
        const cached =
            await cacheService.get<{ user_id: string; user_login: string; user_name: string }[]>(
                cacheKey
            );
        if (cached) return cached;

        const response = await apiClient.get('https://api.twitch.tv/helix/chat/chatters', {
            params: {
                broadcaster_id: broadcasterId,
                moderator_id: moderatorId,
                first: 100
            },
            headers: getHeaders(token)
        });
        const chatters = response.data.data;
        // Cachear por 30 segundos — suficiente para evitar ráfagas repetidas
        await cacheService.set(cacheKey, chatters, 30);
        return chatters;
    } catch (error) {
        return handleTwitchError(error, `getChatters(${broadcasterId})`);
    }
};

export const timeoutUser = async (
    broadcasterId: string,
    moderatorId: string,
    userId: string,
    duration: number,
    reason: string,
    token: string
) => {
    try {
        await apiClient.post(
            'https://api.twitch.tv/helix/moderation/bans',
            {
                data: {
                    user_id: userId,
                    duration: duration,
                    reason: reason
                }
            },
            {
                params: {
                    broadcaster_id: broadcasterId,
                    moderator_id: moderatorId
                },
                headers: {
                    ...getHeaders(token),
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        return handleTwitchError(error, `timeoutUser(${broadcasterId}, target: ${userId})`);
    }
};
