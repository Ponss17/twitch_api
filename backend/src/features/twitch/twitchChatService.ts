import { TwitchChannelInfo } from '../../types/twitch';
import { TwitchApiError } from '../../core/errors/AppError';
import * as cacheService from '../../core/database/cacheService';
import { CACHE_TTL } from '../../core/config/cacheTtl';
import { apiClient, handleTwitchError, getHeaders } from './twitchClient';

export type ChatterEligibility = 'all' | 'subs' | 'mods' | 'vips';

type ChatterRow = { user_id: string; user_login: string; user_name: string };

async function paginateHelixLogins(
    url: string,
    params: Record<string, string | number>,
    token: string
): Promise<string[]> {
    const logins: string[] = [];
    let cursor: string | undefined;

    do {
        const response = await apiClient.get(url, {
            params: {
                ...params,
                first: 100,
                ...(cursor ? { after: cursor } : {})
            },
            headers: getHeaders(token)
        });

        const rows = response.data.data as { user_login?: string }[];
        for (const row of rows) {
            if (row.user_login) logins.push(row.user_login.toLowerCase());
        }

        cursor = response.data.pagination?.cursor;
    } while (cursor);

    return logins;
}

export const getModeratorLogins = async (broadcasterId: string, token: string): Promise<string[]> => {
    const cacheKey = `cache:eligibility:mods:${broadcasterId}`;
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const logins = await paginateHelixLogins(
        'https://api.twitch.tv/helix/moderation/moderators',
        { broadcaster_id: broadcasterId },
        token
    );

    await cacheService.set(cacheKey, logins, CACHE_TTL.ELIGIBILITY);
    return logins;
};

export const getVipLogins = async (broadcasterId: string, token: string): Promise<string[]> => {
    const cacheKey = `cache:eligibility:vips:${broadcasterId}`;
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const logins = await paginateHelixLogins(
        'https://api.twitch.tv/helix/channels/vips',
        { broadcaster_id: broadcasterId },
        token
    );

    await cacheService.set(cacheKey, logins, CACHE_TTL.ELIGIBILITY);
    return logins;
};

export const getSubscriberLogins = async (broadcasterId: string, token: string): Promise<string[]> => {
    const cacheKey = `cache:eligibility:subs:${broadcasterId}`;
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const logins = await paginateHelixLogins(
        'https://api.twitch.tv/helix/subscriptions',
        { broadcaster_id: broadcasterId },
        token
    );

    await cacheService.set(cacheKey, logins, CACHE_TTL.ELIGIBILITY);
    return logins;
};

export const filterChattersByEligibility = async (
    chatters: ChatterRow[],
    broadcasterId: string,
    token: string,
    eligibility: ChatterEligibility
): Promise<ChatterRow[]> => {
    if (eligibility === 'all') return chatters;

    let allowed: string[];
    if (eligibility === 'mods') {
        allowed = await getModeratorLogins(broadcasterId, token);
    } else if (eligibility === 'vips') {
        allowed = await getVipLogins(broadcasterId, token);
    } else {
        allowed = await getSubscriberLogins(broadcasterId, token);
    }

    const allowedSet = new Set(allowed);
    return chatters.filter((c) => allowedSet.has(c.user_login.toLowerCase()));
};

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
        await cacheService.set(cacheKey, data, CACHE_TTL.CHANNEL_INFO);

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
        await cacheService.set(cacheKey, chatters, CACHE_TTL.CHATTERS);
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
