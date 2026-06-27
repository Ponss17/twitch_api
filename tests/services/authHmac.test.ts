jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        TWITCH_CLIENT_SECRET: 'test-secret-for-hmac'
    }
}));

jest.mock('../../backend/src/core/database/dbService', () => ({}));

import { describe, expect, it } from '@jest/globals';
import {
    signAuthExchange,
    verifyAuthExchange,
    verifyState
} from '../../backend/src/features/auth/auth.service';
import crypto from 'crypto';

describe('auth.service HMAC helpers', () => {
    it('verifyState accepts a valid signed state payload', () => {
        const payload = { redirect_origin: 'https://example.com', tz: 'Europe/Madrid' };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const sig = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        const state = `${data}.${sig}`;

        expect(verifyState(state)).toEqual(payload);
    });

    it('verifyState rejects tampered signatures', () => {
        const payload = { redirect_origin: 'https://example.com' };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const expected = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        const state = `${data}.${'0'.repeat(expected.length)}`;

        expect(verifyState(state)).toBeNull();
    });

    it('verifyAuthExchange round-trips signed exchange tokens', () => {
        const payload = {
            apiKey: 'sk_test',
            userId: 'user-1',
            login: 'streamer',
            displayName: 'Streamer'
        };

        const token = signAuthExchange(payload);
        expect(verifyAuthExchange(token)).toMatchObject(payload);
    });

    it('verifyAuthExchange rejects expired tokens', () => {
        const encoded = Buffer.from(
            JSON.stringify({
                apiKey: 'sk_test',
                userId: 'user-1',
                login: 'streamer',
                displayName: 'Streamer',
                exp: Date.now() - 1000
            })
        ).toString('base64url');
        const sig = crypto
            .createHmac('sha256', 'test-secret-for-hmac')
            .update(encoded)
            .digest('base64url');
        const token = `${encoded}.${sig}`;

        expect(verifyAuthExchange(token)).toBeNull();
    });
});
