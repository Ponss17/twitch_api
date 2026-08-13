import crypto from 'crypto';
import { Request, Response } from 'express';
import { CONFIG } from '../config/env';

export const OAUTH_STATE_COOKIE_NAME = 'lp_oauth_state';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_COOKIE_VERSION = 'v1';
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

function getEncryptionKey(): Buffer {
    const secret = CONFIG.HMAC_SIGNING_SECRET ?? (CONFIG.TWITCH_CLIENT_SECRET as string);
    return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

function encryptOAuthState(state: string): string {
    const iv = crypto.randomBytes(GCM_IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(state, 'utf8')), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${OAUTH_STATE_COOKIE_VERSION}.${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${tag.toString('base64url')}`;
}

function decryptOAuthState(payload: string): string | null {
    const parts = payload.split('.');
    if (parts.length !== 4) return null;
    const [version, ivB64, ciphertextB64, tagB64] = parts;
    if (version !== OAUTH_STATE_COOKIE_VERSION) return null;

    try {
        const iv = Buffer.from(ivB64, 'base64url');
        const ciphertext = Buffer.from(ciphertextB64, 'base64url');
        const tag = Buffer.from(tagB64, 'base64url');
        if (iv.length !== GCM_IV_BYTES || tag.length !== GCM_TAG_BYTES) return null;

        const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
        return null;
    }
}

export function setOAuthStateCookie(res: Response, state: string): void {
    res.cookie(OAUTH_STATE_COOKIE_NAME, encryptOAuthState(state), {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: OAUTH_STATE_TTL_MS
    });
}

export function clearOAuthStateCookie(res: Response): void {
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 0
    });
}

export function readOAuthStateCookie(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(';')) {
        const [name, ...value] = part.trim().split('=');
        if (name === OAUTH_STATE_COOKIE_NAME && value.length > 0) {
            const decoded = decodeURIComponent(value.join('='));
            return decryptOAuthState(decoded);
        }
    }
    return null;
}
