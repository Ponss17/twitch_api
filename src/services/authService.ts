import axios from 'axios';
import { CONFIG } from '../config/env';

export const getAuthorizeUrl = (redirectOrigin: string): string => {
    const scope = 'user:read:email moderator:read:followers clips:edit';
    const state = Buffer.from(JSON.stringify({ redirectOrigin })).toString('base64');
    return `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${CONFIG.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
};

export const handleCallback = async (code: string, state: string) => {
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: CONFIG.TWITCH_CLIENT_ID,
            client_secret: CONFIG.TWITCH_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: CONFIG.TWITCH_REDIRECT_URI
        }
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': CONFIG.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`
        }
    });

    const user = userResponse.data.data[0];

    let redirectOrigin = '';
    if (state) {
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            redirectOrigin = decoded.redirectOrigin || '';
        } catch (e) {
            console.error('Error decoding state:', e);
        }
    }

    return { user, access_token, redirectOrigin };
};
