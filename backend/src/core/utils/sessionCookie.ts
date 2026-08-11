import crypto from 'crypto';
import { Request, Response, CookieOptions } from 'express';
import { CONFIG } from '../config/env';

export const SESSION_COOKIE_NAME = 'lp_sess';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_VERSION = 'v2';
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

function getSigningSecret(): string {
    return CONFIG.HMAC_SIGNING_SECRET ?? (CONFIG.TWITCH_CLIENT_SECRET as string);
}

function getEncryptionKey(): Buffer {
    return crypto.createHash('sha256').update(getSigningSecret(), 'utf8').digest();
}

function cookieOptions(maxAge: number): CookieOptions {
    return {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
    };
}

export interface SessionClaims {
    userId: string;
    issuedAt: number;
    nonce: string;
}

export function createSessionCookieValue(
    userId: string,
    nonce: string = crypto.randomBytes(32).toString('base64url'),
    issuedAt: number = Date.now()
): string {
    const payload = {
        userId,
        issuedAt,
        nonce,
        exp: Date.now() + SESSION_TTL_MS
    };
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const iv = crypto.randomBytes(GCM_IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${SESSION_COOKIE_VERSION}.${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${tag.toString('base64url')}`;
}

export function verifySessionCookieClaims(value: string): SessionClaims | null {
    const parts = value.split('.');
    if (parts.length !== 4) return null;

    const [version, ivB64, ciphertextB64, tagB64] = parts;
    if (version !== SESSION_COOKIE_VERSION) return null;

    let decrypted: Buffer;
    try {
        const iv = Buffer.from(ivB64, 'base64url');
        const ciphertext = Buffer.from(ciphertextB64, 'base64url');
        const tag = Buffer.from(tagB64, 'base64url');

        if (iv.length !== GCM_IV_BYTES || tag.length !== GCM_TAG_BYTES) {
            return null;
        }

        const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
        decipher.setAuthTag(tag);
        decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
        return null;
    }

    try {
        const parsed = JSON.parse(decrypted.toString('utf8')) as {
            userId?: string;
            exp?: number;
            issuedAt?: number;
            nonce?: string;
        };
        if (
            !parsed.userId ||
            !parsed.exp ||
            parsed.exp < Date.now() ||
            !parsed.issuedAt ||
            !parsed.nonce
        ) {
            return null;
        }
        return {
            userId: parsed.userId,
            issuedAt: parsed.issuedAt,
            nonce: parsed.nonce
        };
    } catch {
        return null;
    }
}

export function verifySessionCookieValue(value: string): string | null {
    return verifySessionCookieClaims(value)?.userId ?? null;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!cookieHeader) return out;

    for (const part of cookieHeader.split(';')) {
        const [rawKey, ...rest] = part.trim().split('=');
        if (!rawKey || rest.length === 0) continue;
        out[rawKey] = decodeURIComponent(rest.join('='));
    }

    return out;
}

export function readSessionUserId(req: Request): string | null {
    return readSessionClaims(req)?.userId ?? null;
}

export function readSessionClaims(req: Request): SessionClaims | null {
    const cookies = parseCookieHeader(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE_NAME];
    if (!raw) return null;
    return verifySessionCookieClaims(raw);
}

/** Usa res.cookie (no res.append): en Vercel append de Set-Cookie se pierde con frecuencia. */
export function setSessionCookie(res: Response, userId: string, nonce?: string): void {
    const value = createSessionCookieValue(userId, nonce);
    res.cookie(SESSION_COOKIE_NAME, value, cookieOptions(SESSION_TTL_MS));
}

export function clearSessionCookie(res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, cookieOptions(0));
}
