import { apiClient } from '../twitch/twitchClient';
import { CONFIG } from '../../core/config/env';
import { TwitchUser, StoredUser } from '../../types/twitch';
import * as dbService from '../../core/database/dbService';
import * as cacheService from '../../core/database/cacheService';
import crypto from 'crypto';
import { logger } from '../../core/utils/logger';
import { AppError } from '../../core/errors/AppError';
import { MESSAGES } from '../../core/config/messages';
import { overlayRevokeKey } from '../../core/overlay/keys';
import { getHmacSecrets, getPrimaryHmacSecret } from '../../core/utils/hmacSecrets';

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

export const createOAuthState = (
    redirectOrigin: string,
    extraData?: Record<string, unknown>
): string =>
    signState({
        redirectOrigin,
        ...extraData,
        nonce: crypto.randomBytes(32).toString('base64url')
    });

export type OAuthStateConsumeResult = 'ok' | 'replay' | 'unavailable';

export async function consumeOAuthState(state: string): Promise<OAuthStateConsumeResult> {
    const hash = crypto.createHash('sha256').update(state).digest('hex');
    const result = await cacheService.setIfAbsent(
        `auth:oauth-state:burn:${hash}`,
        '1',
        Math.ceil(STATE_TTL_MS / 1000)
    );
    if (result === 'acquired') return 'ok';
    if (result === 'exists') return 'replay';
    return 'unavailable';
}

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

export const getAuthorizeUrl = (
    redirectOrigin: string,
    extraData?: Record<string, unknown>,
    providedState?: string
): string => {
    const scope =
        'user:read:email moderator:read:followers clips:edit moderator:read:chatters user:write:chat chat:read chat:edit moderator:manage:banned_users channel:read:vips channel:read:subscriptions';
    const state = providedState ?? createOAuthState(redirectOrigin, extraData);

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
    const existingUser = await dbService.getUser(user.id, { bypassCache: true });
    if (existingUser && existingUser.apiKey) {
        apiKey = existingUser.apiKey;
    }

    const nowIso = new Date().toISOString();
    // Primer ingreso: solo se asigna en el alta. Si el usuario ya existe pero el campo
    // no vino en caché, NO usar "ahora" (saveUser omite created_at y conserva el de DB).
    const createdAt = existingUser?.createdAt ?? (existingUser ? undefined : nowIso);
    // Último ingreso previo en UI = lastActive anterior; al loguear guardamos este login.
    const previousLastActive = existingUser?.lastActive;

    const storedUser: StoredUser = {
        userId: user.id,
        login: user.login,
        displayName: user.display_name,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        obtainedAt: Date.now(),
        tokenExpiresAt: Date.now() + expires_in * 1000,
        createdAt,
        apiKey,
        profileImageUrl: user.profile_image_url,
        isActive: existingUser?.isActive ?? true,
        blockedReason: existingUser?.blockedReason,
        customRateLimit: existingUser?.customRateLimit,
        customCacheTtl: existingUser?.customCacheTtl,
        role: existingUser?.role,
        stats: existingUser?.stats,
        totalRequests: existingUser?.totalRequests,
        // Conserva el lastActive previo para "Último Ingreso Previo" hasta el próximo bump.
        // Si no había, marca este login.
        lastActive: previousLastActive ?? nowIso,
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

    // preservePlan: el rol/cuota en Supabase es la fuente de verdad (no se pisa en re-login).
    await dbService.saveUser(storedUser, {
        preservePlan: Boolean(existingUser)
    });

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
        await cacheService.revokeApiKeyGlobally(oldApiKey);
        await cacheService.invalidateApiKeyCache(oldApiKey);
    }
    await cacheService.setSensitive(
        overlayRevokeKey(userId),
        Date.now(),
        30 * 24 * 60 * 60
    );

    return newApiKey;
};
