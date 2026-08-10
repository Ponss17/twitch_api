import axios from 'axios';
import { apiClient } from '../twitch/twitchClient';
import { CONFIG } from '../../core/config/env';
import { TwitchUser, StoredUser } from '../../types/twitch';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import crypto from 'crypto';
import { logger } from '../../core/utils/logger';
import { BoundedMap } from '../../core/utils/boundedCache';
import { AppError } from '../../core/errors/AppError';
import { MESSAGES } from '../../core/config/messages';
import { overlayRevokeKey, type OverlayReadPayload } from '../../core/overlay/keys';
import { getHmacSecrets, getPrimaryHmacSecret } from '../../core/utils/hmacSecrets';

export type { OverlayReadPayload } from '../../core/overlay/keys';

const overlayTokenCache = new BoundedMap<string, { payload: OverlayReadPayload; expiry: number }>(200);
const OVERLAY_TOKEN_CACHE_MS = 5 * 60 * 1000;

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2';
const TWITCH_API_URL = 'https://api.twitch.tv/helix';
const STATE_TTL_MS = 10 * 60 * 1000;

const signState = (payload: object): string => {
    const data = Buffer.from(
        JSON.stringify({ ...payload, exp: Date.now() + STATE_TTL_MS })
    ).toString('base64');
    const secret = getPrimaryHmacSecret();
    const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return `${data}.${sig}`;
};

export const verifyState = (state: string): Record<string, unknown> | null => {
    if (typeof state !== 'string') return null;
    const lastDot = state.lastIndexOf('.');
    if (lastDot === -1) return null;
    const data = state.slice(0, lastDot);
    const sig = state.slice(lastDot + 1);
    const secrets = getHmacSecrets();
    let valid = false;
    for (const secret of secrets) {
        const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
        try {
            if (crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
                valid = true;
                break;
            }
        } catch { continue; }
    }
    if (!valid) return null;
    try {
        const parsed = JSON.parse(Buffer.from(data, 'base64').toString()) as Record<string, unknown> & {
            exp?: number;
        };
        if (!parsed.exp || parsed.exp < Date.now()) return null;
        return parsed;
    } catch {
        return null;
    }
};

const AUTH_EXCHANGE_TTL_MS = 5 * 60 * 1000;
/** Token de solo lectura para OBS — no expone la API key maestra. */
const OVERLAY_READ_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const authExchangeBurnMemory = new BoundedMap<string, number>(500);

function authExchangeBurnHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/** Canje único del token HMAC post-OAuth. */
export type AuthExchangeConsumeResult = 'ok' | 'replay' | 'unavailable';

/** Canje único del token HMAC post-OAuth. */
export async function consumeAuthExchangeToken(token: string): Promise<AuthExchangeConsumeResult> {
    const hash = authExchangeBurnHash(token);
    const memExpiry = authExchangeBurnMemory.get(hash);
    if (memExpiry && memExpiry > Date.now()) {
        return 'replay';
    }
    if (memExpiry) authExchangeBurnMemory.delete(hash);

    const kvKey = `auth:exchange:burn:${hash}`;
    const ttlSec = Math.ceil(AUTH_EXCHANGE_TTL_MS / 1000);
    const claimed = await cacheService.setIfAbsent(kvKey, '1', ttlSec);

    if (claimed === 'unavailable') {
        if (process.env.NODE_ENV === 'production') {
            return 'unavailable';
        }
        authExchangeBurnMemory.set(hash, Date.now() + AUTH_EXCHANGE_TTL_MS);
        return 'ok';
    }

    if (claimed === 'exists') {
        authExchangeBurnMemory.set(hash, Date.now() + AUTH_EXCHANGE_TTL_MS);
        return 'replay';
    }

    authExchangeBurnMemory.set(hash, Date.now() + AUTH_EXCHANGE_TTL_MS);
    return 'ok';
}

export interface AuthExchangePayload {
    userId: string;
    login: string;
    displayName: string;
    profile_image_url?: string;
}

export const signAuthExchange = (payload: AuthExchangePayload): string => {
    const data = { ...payload, exp: Date.now() + AUTH_EXCHANGE_TTL_MS };
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
    const secret = getPrimaryHmacSecret();
    const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
};

export const signOverlayReadToken = (payload: OverlayReadPayload): string => {
    const iat = Date.now();
    const data = {
        ...payload,
        scope: 'overlay:read',
        iat,
        exp: iat + OVERLAY_READ_TTL_MS
    };
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
    const secret = getPrimaryHmacSecret();
    const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
};

export const verifyOverlayReadToken = (token: string): OverlayReadPayload | null => {
    const cached = overlayTokenCache.get(token);
    if (cached && cached.expiry > Date.now()) {
        return cached.payload;
    }
    if (cached) overlayTokenCache.delete(token);

    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const encoded = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const secrets = getHmacSecrets();
    let valid = false;
    for (const secret of secrets) {
        const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
        try {
            if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
                valid = true;
                break;
            }
        } catch { continue; }
    }
    if (!valid) return null;
    try {
        const data = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as OverlayReadPayload & {
            exp?: number;
            scope?: string;
        };
        if (data.scope !== 'overlay:read' || !data.exp || data.exp < Date.now()) return null;
        if (!data.userId || !data.tool || !data.login) return null;
        const payload: OverlayReadPayload = {
            userId: data.userId,
            tool: data.tool,
            login: data.login,
            displayName: data.displayName || data.login,
            profile_image_url: data.profile_image_url,
            iat: data.iat
        };
        overlayTokenCache.set(token, {
            payload,
            expiry: Date.now() + OVERLAY_TOKEN_CACHE_MS
        });
        return payload;
    } catch {
        return null;
    }
};

/** Tokens emitidos antes de la revocación (regenerate-key, delete-account) quedan invalidados. */
export async function isOverlayTokenRevoked(payload: OverlayReadPayload): Promise<boolean> {
    if (!payload.iat) return false;
    const revokedAt = await cacheService.get<number>(overlayRevokeKey(payload.userId));
    return typeof revokedAt === 'number' && payload.iat < revokedAt;
}

export const verifyAuthExchange = (token: string): AuthExchangePayload | null => {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return null;
    const encoded = token.slice(0, lastDot);
    const sig = token.slice(lastDot + 1);
    const secrets = getHmacSecrets();
    let valid = false;
    for (const secret of secrets) {
        const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
        try {
            if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
                valid = true;
                break;
            }
        } catch { continue; }
    }
    if (!valid) return null;
    try {
        const data = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as AuthExchangePayload & {
            exp?: number;
        };
        if (!data.exp || data.exp < Date.now()) return null;
        if (!data.userId || !data.login) return null;
        return {
            userId: data.userId,
            login: data.login,
            displayName: data.displayName || data.login,
            profile_image_url: data.profile_image_url
        };
    } catch {
        return null;
    }
};

export const getAuthorizeUrl = (
    redirectOrigin: string,
    extraData?: Record<string, unknown>
): string => {
    const scope =
        'user:read:email moderator:read:followers clips:edit moderator:read:chatters user:write:chat chat:read chat:edit moderator:manage:banned_users channel:read:vips channel:read:subscriptions';
    const state = signState({ redirectOrigin, ...extraData });

    const params = new URLSearchParams({
        client_id: CONFIG.TWITCH_CLIENT_ID as string,
        redirect_uri: CONFIG.TWITCH_REDIRECT_URI as string,
        response_type: 'code',
        scope: scope,
        state: state,
        // Obliga a re-aceptar scopes (p. ej. moderator:read:followers) tras añadir permisos nuevos.
        force_verify: 'true'
    });

    return `${TWITCH_AUTH_URL}/authorize?${params.toString()}`;
};

export const handleCallback = async (
    code: string,
    state: string,
    decodedState?: Record<string, unknown> | null
): Promise<{
    user: TwitchUser;
    access_token: string;
    redirectOrigin: string;
    apiKey: string;
}> => {
    const params = new URLSearchParams({
        client_id: CONFIG.TWITCH_CLIENT_ID as string,
        client_secret: CONFIG.TWITCH_CLIENT_SECRET as string,
        code,
        grant_type: 'authorization_code',
        redirect_uri: CONFIG.TWITCH_REDIRECT_URI as string
    });
    
    const tokenResponse = await apiClient.post(`${TWITCH_AUTH_URL}/token`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const { access_token, refresh_token, expires_in, scope: grantedScope } = tokenResponse.data;

    const grantedScopes = (Array.isArray(grantedScope) ? grantedScope.join(' ') : String(grantedScope || ''))
        .split(/[\s,]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);

    const userResponse = await apiClient.get(`${TWITCH_API_URL}/users`, {
        headers: {
            'Client-ID': CONFIG.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${access_token}`
        }
    });

    const user = userResponse.data.data[0] as TwitchUser;

    if (!grantedScopes.includes('moderator:read:followers')) {
        logger.error('OAuth sin scope moderator:read:followers', {
            login: user.login,
            userId: user.id,
            grantedScopes
        });
    } else {
        logger.info('OAuth scopes OK para followage', {
            login: user.login,
            hasFollowersScope: true
        });
    }

    let apiKey: string = crypto.randomUUID();
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
        expiresIn: expires_in,
        obtainedAt: Date.now(),
        tokenExpiresAt: Date.now() + expires_in * 1000,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        apiKey,
        profileImageUrl: user.profile_image_url,
        isActive: existingUser?.isActive ?? true,
        blockedReason: existingUser?.blockedReason,
        customRateLimit: existingUser?.customRateLimit,
        customCacheTtl: existingUser?.customCacheTtl,
        role: existingUser?.role,
        stats: existingUser?.stats,
        totalRequests: existingUser?.totalRequests,
        lastActive: existingUser?.lastActive,
        timezone: (existingUser?.timezone && existingUser.timezone !== 'UTC') ? existingUser.timezone : ((decodedState?.tz as string) || 'UTC'),
        // Preservar vínculo Discord: un re-login Twitch no debe desvincular.
        discordId: existingUser?.discordId ?? null,
        discordUsername: existingUser?.discordUsername ?? null,
        discordAvatar: existingUser?.discordAvatar ?? null,
        discordLinkedAt: existingUser?.discordLinkedAt ?? null,
        discordUpdatedAt: existingUser?.discordUpdatedAt ?? null
    };

    if (!refresh_token) {
        logger.warn(
            '⚠ ADVERTENCIA: No se recibió Refresh Token de Twitch. La sesión no se renovará automáticamente.'
        );
    }

    await dbService.saveUser(storedUser);

    // Invalidar L1 de API keys: si no, instancias warm siguen con el accessToken
    // anterior (sin scopes nuevos) y followage falla aunque el re-login haya ido bien.
    _invalidateCacheFn?.(user.id);

    let redirectOrigin = '';
    if (state) {
        const decoded = decodedState ?? verifyState(state);
        if (!decoded) {
            logger.warn('⚠ OAuth state inválido o manipulado. Ignorando redirectOrigin.');
        } else {
            redirectOrigin = (decoded.redirectOrigin as string) || '';
        }
    }

    return { user, access_token, redirectOrigin, apiKey };
};

// Para evitar que múltiples peticiones simultáneas refresquen el mismo token (Race Condition)
const refreshPromises = new Map<string, Promise<string>>();
const MAX_REFRESH_PROMISES = 100;
const REFRESH_TIMEOUT_MS = 15_000;
/** Margen amplio para renovar el token antes de que expire.
 * 30 minutos garantiza que incluso con CPU throttle en Vercel haya tiempo suficiente. */
const TOKEN_EXPIRY_BUFFER_MS = 30 * 60 * 1000;

export function isOAuthTokenNearExpiry(
    user: StoredUser,
    bufferMs: number = TOKEN_EXPIRY_BUFFER_MS
): boolean {
    let expiresAt = 0;
    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        expiresAt = user.tokenExpiresAt;
    } else if (user.obtainedAt && user.expiresIn) {
        expiresAt = user.obtainedAt + user.expiresIn * 1000;
    }
    if (!expiresAt) return false;
    return Date.now() + bufferMs > expiresAt;
}

export const refreshUserToken = async (userId: string): Promise<string> => {
    if (refreshPromises.has(userId)) {
        logger.info(`[Auth] Reusing existing refresh promise for user ${userId}`);
        return refreshPromises.get(userId)!;
    }

    if (refreshPromises.size >= MAX_REFRESH_PROMISES) {
        const first = refreshPromises.keys().next().value;
        if (first) refreshPromises.delete(first);
    }

    const refreshTask = (async () => {
        const user = await dbService.getUser(userId);
        if (!user || !user.refreshToken) {
            logger.error(`❌ Error renovando token: Usuario ${userId} no tiene Refresh Token.`);
            throw new AppError(MESSAGES.AUTH.NO_REFRESH_TOKEN, 401);
        }

        let timeoutId: NodeJS.Timeout | undefined;
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Token refresh timeout (15s)')),
                    REFRESH_TIMEOUT_MS
                );
            });

            const params = new URLSearchParams({
                client_id: CONFIG.TWITCH_CLIENT_ID as string,
                client_secret: CONFIG.TWITCH_CLIENT_SECRET as string,
                grant_type: 'refresh_token',
                refresh_token: user.refreshToken
            });

            const refreshRequest = apiClient.post(`${TWITCH_AUTH_URL}/token`, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const response = await Promise.race([refreshRequest, timeoutPromise]);

            const { access_token, refresh_token, expires_in } = response.data;

            user.accessToken = access_token;
            if (refresh_token) user.refreshToken = refresh_token;
            user.expiresIn = expires_in;
            user.obtainedAt = Date.now();
            user.tokenExpiresAt = Date.now() + expires_in * 1000;

            await dbService.saveUser(user, { tokensOnly: true });
            return access_token;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger.error('❌ Error API Twitch (Refresh):', {
                    userId,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else {
                logger.error('❌ Error renovando token:', { userId, error });
            }
            throw new AppError(MESSAGES.AUTH.RENEW_ERROR, 401);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            refreshPromises.delete(userId);
        }
    })();

    refreshPromises.set(userId, refreshTask);
    return refreshTask;
};

/**
 * Consulta el endpoint /oauth2/validate de Twitch para conocer el `expires_in` real
 * cuando la expiración no está persistida (legacy: obtainedAt/expiresIn = 0).
 * - 401 → token revocado/expirado → devuelve 0 (forzar refresh).
 * - error transitorio (red/timeout) → devuelve null (no forzar refresh innecesario).
 */
const probeTokenExpiresAt = async (accessToken: string): Promise<number | null> => {
    try {
        const res = await apiClient.get(`${TWITCH_AUTH_URL}/validate`, {
            headers: { Authorization: `OAuth ${accessToken}` },
            timeout: 8000
        });
        return Date.now() + (Number(res.data?.expires_in) || 0) * 1000;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            return 0;
        }
        return null;
    }
};

const ensureValidToken = async (
    user: StoredUser,
    errorPrefix: string
): Promise<{ accessToken: string; userId: string }> => {
    // 30 minutos de buffer: renovar mucho antes de que el token expire
    const renewalThreshold = Date.now() + TOKEN_EXPIRY_BUFFER_MS;
    let expiresAt = 0;

    if (user.tokenExpiresAt && user.tokenExpiresAt > 0) {
        expiresAt = user.tokenExpiresAt;
    } else if (user.obtainedAt && user.expiresIn) {
        expiresAt = user.obtainedAt + user.expiresIn * 1000;
    }

    if (!expiresAt) {
        const probed = await probeTokenExpiresAt(user.accessToken);
        if (probed === null) {
            expiresAt = Date.now() + 10 * 60 * 1000;
        } else {
            expiresAt = probed;
            if (probed > 0) {
                user.tokenExpiresAt = probed;
                void dbService.saveUser(user, { tokensOnly: true }).catch((e) =>
                    logger.warn('No se pudo persistir token_expires_at:', e)
                );
            }
        }
    }

    if (renewalThreshold > expiresAt) {
        try {
            const newToken = await refreshUserToken(user.userId);
            return { accessToken: newToken, userId: user.userId };
        } catch (_error) {
            if (Date.now() > expiresAt) {
                logger.error(`Token expirado y refresh falló para ${errorPrefix} ${user.userId}`);
                throw new AppError(MESSAGES.AUTH.SESSION_EXPIRED, 401);
            }
            logger.warn(
                `Refresh falló pero token aún válido para ${errorPrefix} ${user.userId}, usando token actual`
            );
        }
    }

    return { accessToken: user.accessToken, userId: user.userId };
};

export const getValidTokenByLogin = async (
    login: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByLogin(login);
    if (!user) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, 404);
    return ensureValidToken(user, `login ${login}`);
};

export const getValidTokenForUser = async (
    user: StoredUser
): Promise<{ accessToken: string; userId: string }> => {
    return ensureValidToken(user, 'API Key');
};

export const getValidToken = async (
    apiKey: string
): Promise<{ accessToken: string; userId: string }> => {
    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) throw new AppError(MESSAGES.AUTH.INVALID_KEY, 401);
    return getValidTokenForUser(user);
};

let _invalidateCacheFn: ((userId: string) => void) | null = null;

export const registerCacheInvalidator = (fn: (userId: string) => void): void => {
    _invalidateCacheFn = fn;
};

export const regenerateApiKey = async (userId: string): Promise<string> => {
    const user = await dbService.getUser(userId);
    if (!user) throw new AppError(MESSAGES.SYSTEM.USER_NOT_FOUND, 404);

    const oldApiKey = user.apiKey;
    const newApiKey = crypto.randomUUID();
    user.apiKey = newApiKey;

    await dbService.saveUser(user);

    // Invalidar caché en memoria y en KV para que la clave vieja deje de funcionar de inmediato
    _invalidateCacheFn?.(userId);
    if (oldApiKey) {
        cacheService
            .invalidateApiKeyCache(oldApiKey)
            .catch((e) => logger.error('Error invalidate KV api key cache:', e));
    }

    return newApiKey;
};
