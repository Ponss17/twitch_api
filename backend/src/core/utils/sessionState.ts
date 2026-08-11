import crypto from 'crypto';
import { Response } from 'express';
import * as cacheService from '../database/cacheService';
import { SessionClaims, setSessionCookie } from './sessionCookie';

const SESSION_STATE_TTL_SECONDS = 31 * 24 * 60 * 60;

function sessionStateKey(userId: string): string {
    return `auth:session:nonce:${userId}`;
}

export async function establishSession(res: Response, userId: string): Promise<void> {
    const nonce = crypto.randomBytes(32).toString('base64url');
    await cacheService.setSensitive(sessionStateKey(userId), nonce, SESSION_STATE_TTL_SECONDS);
    setSessionCookie(res, userId, nonce);
}

export async function revokeSessions(userId: string): Promise<void> {
    const revokedNonce = `revoked:${crypto.randomBytes(32).toString('base64url')}`;
    await cacheService.setSensitive(
        sessionStateKey(userId),
        revokedNonce,
        SESSION_STATE_TTL_SECONDS
    );
}

export async function validateSessionState(
    claims: SessionClaims
): Promise<'valid' | 'revoked' | 'unavailable'> {
    const result = await cacheService.getSensitive<string>(sessionStateKey(claims.userId));
    if (result.status === 'unavailable') return 'unavailable';
    if (!result.value || result.value !== claims.nonce) return 'revoked';
    return 'valid';
}
