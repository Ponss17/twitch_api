import axios from 'axios';
import { logger } from '../../core/utils/logger';

export interface WatchtimeResponse {
    minutes: number;
    error?: string;
}

/**
 * Obtiene el watchtime (en minutos) de un usuario en un canal específico
 * utilizando la API pública de puntos de StreamElements.
 */
export async function getStreamElementsWatchtime(channel: string, username: string): Promise<WatchtimeResponse> {
    try {
        // 1. Obtener el ID de cuenta de StreamElements a partir del nombre del canal
        const channelRes = await axios.get(`https://api.streamelements.com/kappa/v2/channels/${channel}`, {
            timeout: 5000,
            validateStatus: () => true
        });

        if (channelRes.status === 404) {
            return { minutes: 0, error: 'not_found' };
        }
        if (channelRes.status !== 200 || !channelRes.data?._id) {
            logger.warn(`SE: No se pudo obtener el canal ${channel}`, { status: channelRes.status });
            return { minutes: 0, error: 'api_error' };
        }

        const accountId = channelRes.data._id;

        // 2. Obtener los puntos/watchtime del usuario en ese canal
        const pointsRes = await axios.get(`https://api.streamelements.com/kappa/v2/points/${accountId}/${username}`, {
            timeout: 5000,
            validateStatus: () => true
        });

        if (pointsRes.status === 404) {
            return { minutes: 0, error: 'not_watching' };
        }
        if (pointsRes.status !== 200 || !pointsRes.data) {
            logger.warn(`SE: No se pudo obtener watchtime de ${username} en ${channel}`, { status: pointsRes.status });
            return { minutes: 0, error: 'api_error' };
        }

        // 'watchtime' viene en minutos desde la API de StreamElements
        const minutes = pointsRes.data.watchtime || 0;
        return { minutes, error: undefined };
    } catch (error) {
        logger.error(`Error al obtener watchtime de SE para ${channel}/${username}:`, error);
        return { minutes: 0, error: 'api_error' };
    }
}
