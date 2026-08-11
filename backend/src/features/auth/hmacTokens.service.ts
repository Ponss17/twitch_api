import crypto from 'crypto';
import * as cacheService from '../../core/database/cacheService';
import { BoundedMap } from '../../core/utils/boundedCache';
import { overlayRevokeKey, type OverlayReadPayload } from '../../core/overlay/keys';
import { getHmacSecrets, getPrimaryHmacSecret } from '../../core/utils/hmacSecrets';

export type { OverlayReadPayload } from '../../core/overlay/keys';

const overlayTokenCache = new BoundedMap<string, { payload: OverlayReadPayload; expiry: number }>(200);
const OVERLAY_TOKEN_CACHE_MS = 5 * 60 * 1000;

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
    const result = await cacheService.getSensitive<number>(overlayRevokeKey(payload.userId));
    if (result.status === 'unavailable') {
        throw new Error('OVERLAY_REVOCATION_STORE_UNAVAILABLE');
    }
    return typeof result.value === 'number' && payload.iat < result.value;
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
