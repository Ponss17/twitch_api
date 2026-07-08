jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        ENCRYPTION_KEY: 'a'.repeat(64),
        TWITCH_CLIENT_SECRET: 'test-client-secret-for-legacy-key'
    }
}));

import { describe, expect, it } from '@jest/globals';
import crypto from 'crypto';
import { encrypt, decrypt, ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY } from '../../backend/src/core/database/cryptoService';

describe('cryptoService', () => {
    it('encrypts and decrypts with AES-256-GCM format', () => {
        const plain = 'secret_refresh_token_123';
        const cipher = encrypt(plain);
        expect(cipher.startsWith('gcm:')).toBe(true);
        expect(decrypt(cipher)).toBe(plain);
    });

    it('decrypts legacy CBC ciphertext', () => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        const encrypted = Buffer.concat([cipher.update('legacy-token', 'utf8'), cipher.final()]);
        const legacy = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

        expect(decrypt(legacy)).toBe('legacy-token');
    });

    it('decrypts with legacy key when primary fails', () => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', LEGACY_ENCRYPTION_KEY, iv);
        const encrypted = Buffer.concat([cipher.update('old-key-token', 'utf8'), cipher.final()]);
        const legacy = `${iv.toString('hex')}:${encrypted.toString('hex')}`;

        expect(decrypt(legacy, LEGACY_ENCRYPTION_KEY)).toBe('old-key-token');
    });
});
