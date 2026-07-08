jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        TWITCH_CLIENT_SECRET: 'test-secret-for-hmac',
        HMAC_SIGNING_SECRET: undefined
    }
}));

jest.mock('../../backend/src/core/database/dbService', () => ({}));

jest.mock('../../backend/src/core/database/cacheService', () => {
    const burns = new Set<string>();
    return {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        setIfAbsent: jest.fn(async (key: string) => {
            if (burns.has(key)) return false;
            burns.add(key);
            return true;
        })
    };
});

import { describe, expect, it } from '@jest/globals';
import {
    signAuthExchange,
    verifyAuthExchange,
    verifyState,
    consumeAuthExchangeToken
} from '../../backend/src/features/auth/auth.service';
import * as cacheService from '../../backend/src/core/database/cacheService';
import crypto from 'crypto';

describe('auth.service HMAC helpers', () => {
    it('verifyState accepts a valid signed state payload', () => {
        const payload = {
            redirect_origin: 'https://example.com',
            tz: 'Europe/Madrid',
            exp: Date.now() + 600_000
        };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const sig = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        const state = `${data}.${sig}`;

        expect(verifyState(state)).toEqual(payload);
    });

    it('verifyState rejects expired state', () => {
        const payload = { redirect_origin: 'https://example.com', exp: Date.now() - 1000 };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const sig = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        expect(verifyState(`${data}.${sig}`)).toBeNull();
    });

    it('verifyState rejects tampered signatures', () => {
        const payload = { redirect_origin: 'https://example.com', exp: Date.now() + 600_000 };
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

    it('consumeAuthExchangeToken allows first use and rejects replay', async () => {
        const payload = {
            apiKey: 'sk_test',
            userId: 'user-1',
            login: 'streamer',
            displayName: 'Streamer'
        };
        const token = signAuthExchange(payload);

        expect(await consumeAuthExchangeToken(token)).toBe(true);
        expect(await consumeAuthExchangeToken(token)).toBe(false);
    });

    it('consumeAuthExchangeToken rejects when KV already marked token', async () => {
        (cacheService.setIfAbsent as jest.Mock).mockResolvedValueOnce(false);

        const token = signAuthExchange({
            apiKey: 'sk_test',
            userId: 'user-1',
            login: 'streamer',
            displayName: 'Streamer'
        });

        expect(await consumeAuthExchangeToken(token)).toBe(false);
    });
});
