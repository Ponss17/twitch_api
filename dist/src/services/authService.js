"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidToken = exports.refreshUserToken = exports.handleCallback = exports.getAuthorizeUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const getAuthorizeUrl = (redirectOrigin) => {
    const scope = 'user:read:email moderator:read:followers clips:edit offline_access';
    const state = Buffer.from(JSON.stringify({ redirectOrigin })).toString('base64');
    return `https://id.twitch.tv/oauth2/authorize?client_id=${env_1.CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${env_1.CONFIG.TWITCH_REDIRECT_URI}&response_type=code&scope=${scope}&state=${state}`;
};
exports.getAuthorizeUrl = getAuthorizeUrl;
const dbService = __importStar(require("./dbService"));
const crypto_1 = __importDefault(require("crypto"));
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
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const userResponse = await axios_1.default.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': env_1.CONFIG.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`
        }
    });
    const user = userResponse.data.data[0];
    let apiKey = crypto_1.default.randomBytes(16).toString('hex');
    const existingUser = await dbService.getUser(user.id);
    if (existingUser && existingUser.apiKey) {
        apiKey = existingUser.apiKey;
    }
    const storedUser = {
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
        }
        catch (e) {
            console.error('Error decoding state:', e);
        }
    }
    return { user, access_token, redirectOrigin, apiKey };
};
exports.handleCallback = handleCallback;
const refreshUserToken = async (userId) => {
    const user = await dbService.getUser(userId);
    if (!user || !user.refreshToken)
        throw new Error('Usuario no encontrado o sin refresh token');
    try {
        const response = await axios_1.default.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: env_1.CONFIG.TWITCH_CLIENT_ID,
                client_secret: env_1.CONFIG.TWITCH_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken
            }
        });
        const { access_token, refresh_token, expires_in } = response.data;
        user.accessToken = access_token;
        if (refresh_token)
            user.refreshToken = refresh_token;
        user.expiresAt = Date.now() + (expires_in * 1000);
        await dbService.saveUser(user);
        return access_token;
    }
    catch (error) {
        console.error('Error refreshing token for user', userId, error);
        throw new Error('No se pudo renovar el token. Relogueate.');
    }
};
exports.refreshUserToken = refreshUserToken;
const getValidToken = async (apiKey) => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user)
        throw new Error('API Key inválida');
    if (Date.now() > user.expiresAt - 5 * 60 * 1000) {
        console.log(`Refreshing token for ${user.login}...`);
        return await (0, exports.refreshUserToken)(user.userId);
    }
    return user.accessToken;
};
exports.getValidToken = getValidToken;
