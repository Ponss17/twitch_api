import axios from 'axios';
import { CONFIG } from '../config/env';
import { TwitchUser } from '../types/twitch';

export const getAuthorizeUrl = (redirectOrigin: string): string => {
    const scope = 'user:read:email moderator:read:followers clips:edit offline_access';
    const state = Buffer.from(JSON.stringify({ redirectOrigin })).toString('base64');
    return `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${CONFIG.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
};

import * as dbService from './dbService';
import { StoredUser } from '../types/twitch';
import crypto from 'crypto';

export const handleCallback = async (code: string, state: string): Promise<{ user: TwitchUser, access_token: string, redirectOrigin: string, apiKey: string }> => {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: CONFIG.TWITCH_CLIENT_ID,
            client_secret: CONFIG.TWITCH_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: CONFIG.TWITCH_REDIRECT_URI
        }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': CONFIG.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`
        }
    });

    const user = userResponse.data.data[0] as TwitchUser;

    let apiKey = crypto.randomBytes(16).toString('hex');
    const existingUser = await dbService.getUser(user.id);
    if (existingUser && existingUser.apiKey) {
        apiKey = existingUser.apiKey;
    }

    const storedUser: StoredUser = {
        userId: user.id,
        login: user.login,
        displayName: user.display_name,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in * 1000),
        apiKey
    };

    await dbService.saveUser(storedUser);

    let redirectOrigin = '';
    if (state) {
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            redirectOrigin = decoded.redirectOrigin || '';
        } catch (e) {
            console.error('Error decoding state:', e);
        }
    }

    return { user, access_token, redirectOrigin, apiKey };
};

export const refreshUserToken = async (userId: string): Promise<string> => {
    const user = await dbService.getUser(userId);
    if (!user || !user.refreshToken) throw new Error('Usuario no encontrado o sin refresh token');

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: CONFIG.TWITCH_CLIENT_ID,
                client_secret: CONFIG.TWITCH_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken
            }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        user.accessToken = access_token;
        if (refresh_token) user.refreshToken = refresh_token;
        user.expiresAt = Date.now() + (expires_in * 1000);

        await dbService.saveUser(user);
        return access_token;
    } catch (error) {
        console.error('Error refreshing token for user', userId, error);
        throw new Error('No se pudo renovar el token. Relogueate.');
    }
};

export const getValidToken = async (apiKey: string): Promise<string> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new Error('API Key inválida');

    if (Date.now() > user.expiresAt - 5 * 60 * 1000) {
        console.log(`Refreshing token for ${user.login}...`);
        return await refreshUserToken(user.userId);
    }

    return user.accessToken;
};
