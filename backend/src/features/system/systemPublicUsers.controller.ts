import { Request, Response } from 'express';
import { kv } from '../../core/database/redisClient';
import * as dbService from '../../core/database/dbService';
import { logger } from '../../core/utils/logger';
import { CONFIG } from '../../core/config/env';
import axios from 'axios';
import { apiClient, getHeaders } from '../twitch/twitchClient';

export const PUBLIC_USERS_CACHE_KEY = 'system:public_users';
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_DESCRIPTION =
    'Pionero de LosPerris API. Manteniendo la barra de calidad absurdamente alta.';

type PublicUserRow = {
    login: string;
    display_name: string | null;
    profile_image_url: string | null;
};

type TwitchUserLite = {
    login?: string;
    profile_image_url?: string;
    broadcaster_type?: string;
};

export async function invalidatePublicUsersCache(): Promise<void> {
    await kv.del(PUBLIC_USERS_CACHE_KEY).catch((e) =>
        logger.warn('No se pudo invalidar cache de public-users:', e)
    );
}

async function getTwitchAppToken(): Promise<string | null> {
    const cached = await kv.get<string>('twitch:app_token');
    if (cached) return cached;

    try {
        const tokenRes = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                client_id: CONFIG.TWITCH_CLIENT_ID as string,
                client_secret: CONFIG.TWITCH_CLIENT_SECRET as string,
                grant_type: 'client_credentials'
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const appToken = tokenRes.data?.access_token as string | undefined;
        if (!appToken) return null;
        await kv.set('twitch:app_token', appToken, { ex: 24 * 60 * 60 });
        return appToken;
    } catch (authErr) {
        logger.error('Error fetching Twitch App Token', authErr);
        return null;
    }
}

async function fetchTwitchProfiles(
    appToken: string,
    logins: string[]
): Promise<Map<string, TwitchUserLite>> {
    const twitchMap = new Map<string, TwitchUserLite>();
    if (logins.length === 0) return twitchMap;

    try {
        const query = logins.map((login) => `login=${encodeURIComponent(login)}`).join('&');
        const twitchRes = await apiClient.get(`https://api.twitch.tv/helix/users?${query}`, {
            headers: getHeaders(appToken)
        });
        for (const tu of (twitchRes.data?.data ?? []) as TwitchUserLite[]) {
            if (tu.login) twitchMap.set(tu.login.toLowerCase(), tu);
        }
    } catch (apiErr) {
        if (axios.isAxiosError(apiErr) && apiErr.response?.status === 401) {
            await kv.del('twitch:app_token').catch(() => {});
        }
        logger.error('Error fetching users from Twitch API', apiErr);
    }
    return twitchMap;
}

export const getPublicUsers = async (_req: Request, res: Response) => {
    try {
        const cachedUsers = await kv.get<
            Array<{
                login: string;
                displayName: string;
                profileImageUrl: string;
                broadcasterType: string;
                description: string;
            }>
        >(PUBLIC_USERS_CACHE_KEY);
        if (cachedUsers && Array.isArray(cachedUsers)) {
            return res.status(200).json({ ok: true, users: cachedUsers });
        }

        const { data: users, error } = await dbService.supabase
            .from('users')
            .select('login, display_name, profile_image_url, created_at')
            .eq('is_active', true)
            .neq('profile_image_url', '')
            .not('profile_image_url', 'is', null)
            .order('created_at', { ascending: true })
            .limit(10);

        if (error || !users) {
            logger.error('Error fetching public users from DB', error);
            return res.status(500).json({ ok: false, users: [] });
        }

        const rows = users as PublicUserRow[];
        const appToken = await getTwitchAppToken();
        const twitchMap = appToken
            ? await fetchTwitchProfiles(
                  appToken,
                  rows.map((u) => u.login).filter(Boolean)
              )
            : new Map<string, TwitchUserLite>();

        const formattedUsers = rows.map((u) => {
            const tu = twitchMap.get(u.login.toLowerCase());
            const broadcasterType = tu?.broadcaster_type || '';
            return {
                login: u.login,
                displayName: u.display_name || u.login,
                profileImageUrl: tu?.profile_image_url || u.profile_image_url || '',
                broadcasterType:
                    broadcasterType === 'affiliate' || broadcasterType === 'partner'
                        ? broadcasterType
                        : 'streamer',
                description: DEFAULT_DESCRIPTION
            };
        });

        await kv.set(PUBLIC_USERS_CACHE_KEY, formattedUsers, { ex: CACHE_TTL_SECONDS });

        return res.status(200).json({ ok: true, users: formattedUsers });
    } catch (error) {
        logger.error('Unexpected error in getPublicUsers', error);
        return res.status(500).json({ ok: false, users: [] });
    }
};
