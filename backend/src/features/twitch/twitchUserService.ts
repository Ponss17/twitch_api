import { TwitchUser, TwitchValidationResponse } from '../../types/twitch';
import * as cacheService from '../../core/database/cacheService';
import { resolveCache } from '../../core/config/cacheTtl';
import { getTimePhraseBetween } from '../../core/utils/time';
import { TwitchApiError } from '../../core/errors/AppError';
import { logger } from '../../core/utils/logger';
import {
    apiClient,
    checkCircuit,
    recordSuccess,
    handleTwitchError,
    getHeaders
} from './twitchClient';
import axios from 'axios';

const userInfoCache = new Map<string, { data: TwitchUser; expiry: number }>();
const MAX_USER_INFO_CACHE = 200;
const USER_INFO_TTL = 30_000;

export const getUserId = async (
    username: string,
    token: string,
    options?: { skipCache?: boolean }
): Promise<string> => {
    try {
        if (!options?.skipCache) {
            const cachedId = await cacheService.getCachedUserId(username);
            if (cachedId) return cachedId;
        }

        const user = await getUserInfo(username, token);
        await cacheService.setCachedUserId(username, user.id);
        return user.id;
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getUserId(${username})`);
    }
};

export const getUserInfo = async (username: string, token: string): Promise<TwitchUser> => {
    const cached = userInfoCache.get(username.toLowerCase());
    if (cached && cached.expiry > Date.now()) return cached.data;

    await checkCircuit();
    const headers = getHeaders(token);
    
    try {
        const response = await apiClient.get(
            `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
            {
                headers
            }
        );

        if (response.data.data.length === 0) {
            throw new TwitchApiError(`El usuario/canal ${username} no existe.`, 404);
        }

        recordSuccess();
        const user = response.data.data[0];

        if (userInfoCache.size >= MAX_USER_INFO_CACHE) {
            const first = userInfoCache.keys().next().value;
            if (first) userInfoCache.delete(first);
        }
        userInfoCache.set(username.toLowerCase(), { data: user, expiry: Date.now() + USER_INFO_TTL });

        return user;
    } catch (error) {
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getUserInfo(${username})`);
    }
};

export function invalidateUserInfoCache(login?: string, userId?: string): void {
    if (login) {
        userInfoCache.delete(login.toLowerCase());
    }
    if (userId) {
        for (const key of [...userInfoCache.keys()]) {
            const entry = userInfoCache.get(key);
            if (entry?.data.id === userId) {
                userInfoCache.delete(key);
            }
        }
    }
}

export type FollowAgeResult = {
    text: string;
    timePhrase: string;
    followDateMs?: number;
};

const followageError = (text: string): FollowAgeResult => ({
    text,
    timePhrase: 'error'
});

const FOLLOWAGE_PERMISSION_MSG = (channel: string) =>
    `No se puede consultar el follow en "${channel}". Debes ser el dueño o moderador del canal (API key de esa cuenta). Si eres el dueño, cierra sesión y vuelve a entrar en el panel para actualizar permisos.`;

function helixHttpStatus(error: unknown): number | undefined {
    if (axios.isAxiosError(error)) return error.response?.status;
    if (error && typeof error === 'object' && 'statusCode' in error) {
        const code = Number((error as { statusCode: unknown }).statusCode);
        return Number.isFinite(code) ? code : undefined;
    }
    return undefined;
}

async function resolveFollowageLoginId(
    login: string,
    token: string,
    label: 'canal' | 'usuario'
): Promise<string | FollowAgeResult> {
    try {
        // IDs frescos: evita KV stale que apunte a otro broadcaster_id.
        return await getUserId(login, token, { skipCache: true });
    } catch (error) {
        const status = helixHttpStatus(error);
        // 401 → dejar subir para que withTwitchAuth renueve el token OAuth.
        if (status === 401) throw error;

        if (status === 404 || (error instanceof TwitchApiError && error.statusCode === 404)) {
            return followageError(
                label === 'canal'
                    ? `El canal "${login}" no existe en Twitch. Revisa que el nombre esté bien escrito.`
                    : `El usuario "${login}" no existe en Twitch. Revisa que el nombre esté bien escrito.`
            );
        }
        const mapped = mapFollowageHelixError(error, login, login);
        if (mapped) return mapped;
        throw error;
    }
}

function mapFollowageHelixError(
    error: unknown,
    channel: string,
    _user: string
): FollowAgeResult | null {
    const status = helixHttpStatus(error);

    if (status === 404) {
        const twitchMsg = axios.isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : error instanceof TwitchApiError
              ? error.message
              : undefined;
        return followageError(
            twitchMsg || `No se encontró información de follow en ${channel}.`
        );
    }

    // 403 = sin permiso real. 401 no se mapea aquí: debe forzar refresh.
    if (status === 403) {
        return followageError(FOLLOWAGE_PERMISSION_MSG(channel));
    }

    if (status === 503) {
        return followageError('Twitch no está disponible ahora mismo. Intenta en unos segundos.');
    }

    return null;
}

export const getFollowAge = async (
    channel: string,
    user: string,
    token: string
): Promise<FollowAgeResult> => {
    if (!token?.trim()) {
        throw new TwitchApiError('Token expirado o inválido.', 401);
    }

    try {
        const channelId = await resolveFollowageLoginId(channel, token, 'canal');
        if (typeof channelId !== 'string') return channelId;

        const userId = await resolveFollowageLoginId(user, token, 'usuario');
        if (typeof userId !== 'string') return userId;

        if (channelId === userId) {
            return {
                text: `${user} es el dueño del canal.`,
                timePhrase: 'toda la vida'
            };
        }

        const headers = getHeaders(token);
        const followRes = await apiClient.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: {
                broadcaster_id: channelId,
                user_id: userId
            }
        });

        const follows = Array.isArray(followRes.data?.data) ? followRes.data.data : [];
        if (follows.length === 0) {
            // Sin scope / sin ser mod: Twitch responde 200 con data=[] y total = seguidores del canal.
            // Con permiso y sin follow: a veces total=0; a veces total sigue siendo el del canal
            // (docs de Twitch muestran ese caso). No confiar solo en total.
            const totalRaw = followRes.data?.total;
            const total =
                typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : null;
            logger.warn('Followage Helix data vacía', {
                channel,
                user,
                channelId,
                userId,
                total,
                hasTotalKey: followRes.data != null && 'total' in followRes.data
            });

            let tokenUserId: string | undefined;
            let tokenLogin: string | undefined;
            try {
                const validation = await validateToken(token);
                if (validation === null) {
                    throw new TwitchApiError('Token expirado o inválido.', 401);
                }
                tokenUserId = validation.user_id;
                tokenLogin = validation.login;
                if (!validation.scopes?.includes('moderator:read:followers')) {
                    return followageError(
                        'Tu cuenta no tiene el permiso de follows (moderator:read:followers). Cierra sesión en el panel y vuelve a entrar aceptando todos los permisos.'
                    );
                }
                // Dueño o mod del canal: Twitch lo valida en Helix (403 si no).
                // No exigir tokenUserId === channelId (bloqueaba mods y pruebas en otros canales).
            } catch (scopeErr) {
                if (helixHttpStatus(scopeErr) === 401) throw scopeErr;
                logger.warn('Followage: no se pudo validar scopes OAuth', scopeErr);
            }

            if (total === 0) {
                return {
                    text: `${user} no sigue a ${channel}.`,
                    timePhrase: 'no sigue'
                };
            }

            // total>0 + data=[] puede ser (a) sin permiso o (b) no sigue con total del canal.
            // Probar listado sin user_id: si hay filas, el token SÍ tiene permiso → "no sigue".
            try {
                const probe = await apiClient.get('https://api.twitch.tv/helix/channels/followers', {
                    headers,
                    params: { broadcaster_id: channelId, first: 1 }
                });
                const probeData = Array.isArray(probe.data?.data) ? probe.data.data : [];
                if (probeData.length > 0) {
                    logger.warn('Followage: permiso OK, usuario no sigue', {
                        channel,
                        user,
                        channelId,
                        userId,
                        tokenUserId,
                        tokenLogin,
                        total
                    });
                    return {
                        text: `${user} no sigue a ${channel}.`,
                        timePhrase: 'no sigue'
                    };
                }
                logger.warn('Followage: probe también vacío (sin permiso real)', {
                    channel,
                    channelId,
                    tokenUserId,
                    tokenLogin,
                    probeTotal:
                        typeof probe.data?.total === 'number' ? probe.data.total : null
                });
            } catch (probeErr) {
                if (helixHttpStatus(probeErr) === 401) throw probeErr;
                logger.warn('Followage: probe de permiso falló', probeErr);
            }

            return followageError(FOLLOWAGE_PERMISSION_MSG(channel));
        }

        const followedAt = follows[0]?.followed_at;
        if (!followedAt) {
            return followageError(
                `Twitch no devolvió la fecha de follow de ${user} en ${channel}. Intenta de nuevo.`
            );
        }

        const followDate = new Date(followedAt);
        if (Number.isNaN(followDate.getTime())) {
            return followageError(
                `Twitch devolvió una fecha de follow inválida para ${user} en ${channel}.`
            );
        }

        const timePhrase = getTimePhraseBetween(followDate);

        return {
            text: `${user} ha seguido a ${channel} por ${timePhrase}.`,
            timePhrase,
            followDateMs: followDate.getTime()
        };
    } catch (error: unknown) {
        if (helixHttpStatus(error) === 401) throw error;

        const mapped = mapFollowageHelixError(error, channel, user);
        if (mapped) return mapped;

        logger.error(`getFollowAge(${channel}, ${user})`, error);
        return followageError('No se pudo consultar el followage. Intenta de nuevo en unos segundos.');
    }
};

/**
 * Valida un token contra Twitch.
 * - Devuelve la respuesta si es válido.
 * - Devuelve `null` SOLO si el token es realmente inválido/expirado (HTTP 401).
 * - LANZA en errores transitorios (red/timeout/5xx) para que el llamador pueda
 *   distinguir "token inválido" de "no se pudo verificar" y no fallar en falso.
 */
export const validateToken = async (token: string): Promise<TwitchValidationResponse | null> => {
    try {
        const headers = { Authorization: `OAuth ${token}` };
        const response = await apiClient.get('https://id.twitch.tv/oauth2/validate', { headers });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return null;
        }
        throw error;
    }
};

export const getFollowersCount = async (broadcasterId: string, token: string): Promise<number> => {
    try {
        const headers = getHeaders(token);
        const response = await apiClient.get('https://api.twitch.tv/helix/channels/followers', {
            headers,
            params: { broadcaster_id: broadcasterId }
        });
        return response.data.total || 0;
    } catch (error) {
        logger.error('Error in getFollowersCount:', error);
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `getFollowersCount(${broadcasterId})`);
    }
};

export const isStreamLive = async (
    userId: string,
    token: string,
    role?: string | null
): Promise<boolean> => {
    const cacheKey = `cache:stream:live:${userId}`;
    try {
        const cached = await cacheService.get<boolean>(cacheKey);
        if (cached !== null && cached !== undefined) return cached;

        const headers = getHeaders(token);
        const response = await apiClient.get('https://api.twitch.tv/helix/streams', {
            headers,
            params: { user_id: userId }
        });
        const live = response.data.data.length > 0;
        await cacheService.set(cacheKey, live, resolveCache('STREAM_LIVE', role));
        return live;
    } catch (error) {
        logger.error('Error in isStreamLive:', error);
        if (error instanceof TwitchApiError) throw error;
        return handleTwitchError(error, `isStreamLive(${userId})`);
    }
};

/**
 * Variantes "best-effort" para el perfil del panel: seguidores y estado en vivo
 * son datos SECUNDARIOS. Si Twitch falla (p. ej. el token carece del scope
 * `moderator:read:followers`), devolvemos `undefined` (dato no disponible) en
 * lugar de romper todo el endpoint con 401 o mentir con 0/offline.
 */
export const getFollowersCountSafe = async (
    broadcasterId: string,
    token: string
): Promise<number | undefined> => {
    try {
        return await getFollowersCount(broadcasterId, token);
    } catch (error) {
        logger.warn('getFollowersCountSafe degradado (dato no disponible):', {
            broadcasterId,
            error: error instanceof Error ? error.message : String(error)
        });
        return undefined;
    }
};

export const isStreamLiveSafe = async (
    userId: string,
    token: string,
    role?: string | null
): Promise<boolean | undefined> => {
    try {
        return await isStreamLive(userId, token, role);
    } catch (error) {
        logger.warn('isStreamLiveSafe degradado (dato no disponible):', {
            userId,
            error: error instanceof Error ? error.message : String(error)
        });
        return undefined;
    }
};
