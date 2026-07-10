jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        ENCRYPTION_KEY: 'a'.repeat(64),
        TWITCH_CLIENT_SECRET: 'test-client-secret-for-legacy-key'
    }
}));

import crypto from 'crypto';
import { describe, expect, it } from '@jest/globals';
import {
    encrypt,
    decrypt,
    ENCRYPTION_KEY,
    LEGACY_ENCRYPTION_KEY,
    isCbcFormat
} from '../../backend/src/core/database/cryptoService';

describe('cryptoService', () => {
    it('encrypts and decrypts with AES-256-GCM format', () => {
        const plain = 'secret_refresh_token_123';
        const cipher = encrypt(plain);
        expect(cipher.startsWith('gcm:')).toBe(true);
        expect(decrypt(cipher)).toBe(plain);
    });

    it('decrypts legacy AES-256-CBC tokens with primary key', () => {
        const plain = 'legacy_access_token';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        const legacyBlob = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

        expect(isCbcFormat(legacyBlob)).toBe(true);
        expect(decrypt(legacyBlob, ENCRYPTION_KEY)).toBe(plain);
    });

    it('decrypts legacy AES-256-CBC tokens with legacy key', () => {
        const plain = 'very_old_refresh_token';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', LEGACY_ENCRYPTION_KEY, iv);
        const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        const legacyBlob = `${iv.toString('hex')}:${encrypted.toString('hex')}`;


        expect(decrypt(legacyBlob, LEGACY_ENCRYPTION_KEY)).toBe(plain);
    });
});
