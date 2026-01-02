"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCallback = exports.getAuthorizeUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const getAuthorizeUrl = (redirectOrigin) => {
    const scope = 'user:read:email moderator:read:followers clips:edit';
    const state = Buffer.from(JSON.stringify({ redirectOrigin })).toString('base64');
    return `https://id.twitch.tv/oauth2/authorize?client_id=${env_1.CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${env_1.CONFIG.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
};
exports.getAuthorizeUrl = getAuthorizeUrl;
const handleCallback = async (code, state) => {
    const tokenResponse = await axios_1.default.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: env_1.CONFIG.TWITCH_CLIENT_ID,
            client_secret: env_1.CONFIG.TWITCH_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: env_1.CONFIG.TWITCH_REDIRECT_URI
        }
    });
    const { access_token } = tokenResponse.data;
    const userResponse = await axios_1.default.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': env_1.CONFIG.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`
        }
    });
    const user = userResponse.data.data[0];
    let redirectOrigin = '';
    if (state) {
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
            redirectOrigin = decoded.redirectOrigin || '';
        }
        catch (e) {
            console.error('Error decoding state:', e);
        }
    }
    return { user, access_token, redirectOrigin };
};
exports.handleCallback = handleCallback;
