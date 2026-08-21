import axios from 'axios';
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

export type ClipDownloadUrls = {
    clip_id: string;
    landscape_download_url: string | null;
    portrait_download_url: string | null;
};

/** Helix Get Clips Download — URLs temporales oficiales (requiere channel:manage:clips). */
export const getClipDownloadUrls = async (
    channel: string,
    editorId: string,
    clipId: string,
    token: string,
    knownBroadcasterId?: string
): Promise<ClipDownloadUrls> => {
    try {
        const broadcasterId = knownBroadcasterId || (await getUserId(channel, token));
        const headers = getHeaders(token);

        const res = await apiClient.get(`https://api.twitch.tv/helix/clips/downloads`, {
            headers,
            params: {
                broadcaster_id: broadcasterId,
                editor_id: editorId,
                clip_id: clipId
            }
        });

        recordSuccess();
        const row = (res.data?.data as ClipDownloadUrls[] | undefined)?.[0];
        if (!row) {
            throw new TwitchApiError('Twitch no devolvió URL de descarga para este clip', 404);
        }
        return row;
    } catch (error: unknown) {
        if (error instanceof TwitchApiError) throw error;
        // 4xx del caller (clip inválido / no editor) no es outage de Twitch.
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status && status >= 400 && status < 500 && status !== 429) {
                const data = error.response?.data as { message?: string } | undefined;
                throw new TwitchApiError(
                    data?.message || 'No se pudo obtener la descarga de este clip',
                    status
                );
            }
        }
        return handleTwitchError(error, `getClipDownloadUrls(${channel}, ${clipId})`);
    }
};
