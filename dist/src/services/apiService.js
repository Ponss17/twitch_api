"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = exports.getFollowAge = exports.getClips = exports.createClip = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const cacheService_1 = require("./cacheService");
const getHeaders = (token) => ({
    'Client-ID': env_1.CONFIG.TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${token}`
});
const getUserId = async (username, token) => {
    // Check cache first
    const cachedId = (0, cacheService_1.getCachedUserId)(username);
    if (cachedId)
        return cachedId;
    // Fetch from Twitch if not in cache
    const headers = getHeaders(token);
    const response = await axios_1.default.get(`https://api.twitch.tv/helix/users?login=${username}`, { headers });
    if (response.data.data.length === 0) {
        throw { status: 404, message: `El usuario/canal ${username} no existe.` };
    }
    const id = response.data.data[0].id;
    // Save to cache
    (0, cacheService_1.setCachedUserId)(username, id);
    return id;
};
const createClip = async (channel, token) => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);
        const clipRes = await axios_1.default.post(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`, null, { headers });
        const clipData = clipRes.data.data[0];
        return `https://clips.twitch.tv/${clipData.id}`;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
            throw { status: 404, message: `No se pudo crear clip. Asegúrate de que ${channel} esté en vivo.` };
        }
        throw error;
    }
};
exports.createClip = createClip;
const getClips = async (channel, limit, token) => {
    const broadcasterId = await getUserId(channel, token);
    const headers = getHeaders(token);
    const clipsRes = await axios_1.default.get(`https://api.twitch.tv/helix/clips`, {
        headers,
        params: {
            broadcaster_id: broadcasterId,
            first: limit
        }
    });
    return clipsRes.data.data;
};
exports.getClips = getClips;
const getFollowAge = async (channel, user, token) => {
    try {
        const [channelId, userId] = await Promise.all([
            getUserId(channel, token),
            getUserId(user, token)
        ]);
        const headers = getHeaders(token);
        const followRes = await axios_1.default.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: {
                broadcaster_id: channelId,
                user_id: userId
            }
        });
        if (followRes.data.data.length === 0) {
            return `${user} no sigue a ${channel}.`;
        }
        const followDate = new Date(followRes.data.data[0].followed_at);
        const now = new Date();
        const diff = Math.abs(now.getTime() - followDate.getTime());
        const parts = {
            años: Math.floor(diff / (1000 * 60 * 60 * 24 * 365)),
            meses: Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
            días: Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
            horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            segundos: Math.floor((diff % (1000 * 60)) / 1000)
        };
        let timeString = [];
        if (parts.años > 0)
            timeString.push(`${parts.años} años`);
        if (parts.meses > 0)
            timeString.push(`${parts.meses} meses`);
        if (parts.días > 0)
            timeString.push(`${parts.días} días`);
        if (parts.horas > 0)
            timeString.push(`${parts.horas} horas`);
        if (parts.minutos > 0)
            timeString.push(`${parts.minutos} minutos`);
        if (parts.segundos > 0 || timeString.length === 0)
            timeString.push(`${parts.segundos} segundos`);
        const finalString = timeString.length > 1
            ? timeString.slice(0, -1).join(', ') + ' y ' + timeString.slice(-1)
            : timeString[0];
        return `${user} ha seguido a ${channel} por ${finalString}.`;
    }
    catch (error) {
        // If getUserId throws 404, we catch it here to return the text friendly message
        const err = error;
        if (err.status === 404)
            return err.message || 'Usuario no encontrado';
        throw error;
    }
};
exports.getFollowAge = getFollowAge;
const validateToken = async (token) => {
    try {
        const headers = { 'Authorization': `OAuth ${token}` };
        await axios_1.default.get('https://id.twitch.tv/oauth2/validate', { headers });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.validateToken = validateToken;
