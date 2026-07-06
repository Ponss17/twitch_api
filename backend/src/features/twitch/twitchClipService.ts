import { TwitchClip } from '../../types/twitch';
import { TwitchApiError } from '../../core/errors/AppError';
import { apiClient, recordSuccess, handleTwitchError, getHeaders } from './twitchClient';
import { getUserId } from './twitchUserService';

export const createClip = async (
    channel: string,
    token: string,
    title?: string
): Promise<string> => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);

        let url = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`;
        if (title) {
            url += `&title=${encodeURIComponent(title)}`;
        }

        const clipRes = await apiClient.post(url, null, { headers });
        if (!clipRes.data.data || clipRes.data.data.length === 0) {
            throw new TwitchApiError('La respuesta de Twitch no incluyó datos de clip', 500);
        }
        const clipData = clipRes.data.data[0];
        recordSuccess();
        return `https://clips.twitch.tv/${clipData.id}`;
    } catch (error: unknown) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `createClip(${channel})`);
    }
};

export const getClips = async (
    channel: string,
    limit: number,
    token: string
): Promise<TwitchClip[]> => {
    try {
        const broadcasterId = await getUserId(channel, token);
        const headers = getHeaders(token);

        const clipsRes = await apiClient.get(`https://api.twitch.tv/helix/clips`, {
            headers,
            params: {
                broadcaster_id: broadcasterId,
                first: limit
            }
        });

        recordSuccess();
        return clipsRes.data.data as TwitchClip[];
    } catch (error) {
        return handleTwitchError(error, `getClips(${channel})`);
    }
};
