import axios from 'axios';
import { CONFIG } from '../config/env';
import { TwitchUser, StoredUser } from '../types/twitch';
import { kv } from '@vercel/kv';
import * as dbService from './dbService';
import crypto from 'crypto';
import { MESSAGES } from '../config/messages';

export const getAuthorizeUrl = (redirectOrigin: string): string => {
    const scope = 'user:read:email moderator:read:followers clips:edit moderator:read:chatters user:write:chat';
    const state = Buffer.from(JSON.stringify({ redirectOrigin })).toString('base64');
    return `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${CONFIG.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
};

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
        apiKey,
        profileImageUrl: user.profile_image_url
    };

    if (!refresh_token) {
        console.warn('⚠ ADVERTENCIA: No se recibió Refresh Token de Twitch. La sesión no se renovará automáticamente.');
    }

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
    if (!user || !user.refreshToken) {
        console.error(`❌ Error renovando token: Usuario ${userId} no tiene Refresh Token.`);
        throw new Error('Usuario no encontrado o sin refresh token');
    }

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
        if (axios.isAxiosError(error)) {
            console.error('❌ Error API Twitch (Refresh):', error.response?.data || error.message);
        } else {
            console.error('❌ Error renovando token:', error);
        }
        throw new Error('No se pudo renovar el token. Relogueate.');
    }
};

export const getValidToken = async (apiKey: string): Promise<{ accessToken: string, userId: string }> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new Error('API Key inválida');

    if (Date.now() > user.expiresAt - 5 * 60 * 1000) {
        const newToken = await refreshUserToken(user.userId);
        return { accessToken: newToken, userId: user.userId };
    }

    return { accessToken: user.accessToken, userId: user.userId };
};

export const regenerateApiKey = async (userId: string): Promise<string> => {
    const user = await dbService.getUser(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const newApiKey = crypto.randomUUID();
    user.apiKey = newApiKey;

    await dbService.saveUser(user);
    return newApiKey;
};
