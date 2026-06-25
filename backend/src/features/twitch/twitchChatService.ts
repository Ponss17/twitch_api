import { TwitchChannelInfo } from '../../types/twitch';
import { TwitchApiError } from '../../core/errors/AppError';
import * as cacheService from '../../core/database/cacheService';
import { CACHE_TTL } from '../../core/config/cacheTtl';
import { apiClient, handleTwitchError, getHeaders } from './twitchClient';

export type ChatterEligibility = 'subs' | 'mods' | 'vips' | 'viewers';

type ChatterRow = {
    user_id: string;
    user_login: string;
    user_name: string;
    mod?: boolean;
    sub?: boolean;
    vip?: boolean;
};

const VALID_ELIGIBILITY = new Set<ChatterEligibility>(['subs', 'mods', 'vips', 'viewers']);

export function parseEligibilityQuery(raw?: string): 'all' | ChatterEligibility[] {
    if (!raw || raw === 'all') return 'all';

    const parts = raw
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is ChatterEligibility => VALID_ELIGIBILITY.has(s as ChatterEligibility));

    if (parts.length === 0 || parts.length === 4) return 'all';
    return parts;
}

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

export const annotateChatterRoles = async (
    chatters: ChatterRow[],
    broadcasterId: string,
    token: string
): Promise<ChatterRow[]> => {
    const [modLogins, vipLogins, subLogins] = await Promise.all([
        getModeratorLogins(broadcasterId, token),
        getVipLogins(broadcasterId, token),
        getSubscriberLogins(broadcasterId, token)
    ]);

    const modSet = new Set(modLogins);
    const vipSet = new Set(vipLogins);
    const subSet = new Set(subLogins);

    return chatters.map((c) => {
        const login = c.user_login.toLowerCase();
        return {
            ...c,
            mod: modSet.has(login),
            vip: vipSet.has(login),
            sub: subSet.has(login)
        };
    });
};

export const filterChattersByEligibility = async (
    chatters: ChatterRow[],
    broadcasterId: string,
    token: string,
    eligibility: 'all' | ChatterEligibility[]
): Promise<ChatterRow[]> => {
    if (eligibility === 'all') return chatters;

    const needMods = eligibility.includes('mods');
    const needVips = eligibility.includes('vips');
    const needSubs = eligibility.includes('subs');
    const needViewers = eligibility.includes('viewers');

    const [modLogins, vipLogins, subLogins] = await Promise.all([
        needMods || needViewers ? getModeratorLogins(broadcasterId, token) : Promise.resolve([]),
        needVips || needViewers ? getVipLogins(broadcasterId, token) : Promise.resolve([]),
        needSubs || needViewers ? getSubscriberLogins(broadcasterId, token) : Promise.resolve([])
    ]);

    const modSet = new Set(modLogins);
    const vipSet = new Set(vipLogins);
    const subSet = new Set(subLogins);

    return chatters.filter((c) => {
        const login = c.user_login.toLowerCase();
        const isMod = modSet.has(login);
        const isVip = vipSet.has(login);
        const isSub = subSet.has(login);
        const isViewer = !isMod && !isVip && !isSub;

        if (needMods && isMod) return true;
        if (needVips && isVip) return true;
        if (needSubs && isSub) return true;
        if (needViewers && isViewer) return true;
        return false;
    });
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
