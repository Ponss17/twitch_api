import crypto from 'crypto';
import { Request, Response } from 'express';
import { CONFIG } from '../config/env';

export const SESSION_COOKIE_NAME = 'lp_sess';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSigningSecret(): string {
    return CONFIG.HMAC_SIGNING_SECRET ?? (CONFIG.TWITCH_CLIENT_SECRET as string);
}

function signPayload(encoded: string): string {
    return crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
}

export function createSessionCookieValue(userId: string): string {
    const payload = {
        userId,
        exp: Date.now() + SESSION_TTL_MS
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${signPayload(encoded)}`;
}

export function verifySessionCookieValue(value: string): string | null {
    const lastDot = value.lastIndexOf('.');
    if (lastDot === -1) return null;

    const encoded = value.slice(0, lastDot);
    const sig = value.slice(lastDot + 1);
    const expected = signPayload(encoded);

    try {
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
            return null;
        }
    } catch {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as {
            userId?: string;
            exp?: number;
        };
        if (!parsed.userId || !parsed.exp || parsed.exp < Date.now()) {
            return null;
        }
        return parsed.userId;
    } catch {
        return null;
    }
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
    const cookies = parseCookieHeader(req.headers.cookie);
    const raw = cookies[SESSION_COOKIE_NAME];
    if (!raw) return null;
    return verifySessionCookieValue(raw);
}

export function setSessionCookie(res: Response, userId: string): void {
    const value = createSessionCookieValue(userId);
    const secure = process.env.NODE_ENV === 'production';
    const parts = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
    ];
    if (secure) parts.push('Secure');
    res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
    const secure = process.env.NODE_ENV === 'production';
    const parts = [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0'
    ];
    if (secure) parts.push('Secure');
    res.append('Set-Cookie', parts.join('; '));
}
