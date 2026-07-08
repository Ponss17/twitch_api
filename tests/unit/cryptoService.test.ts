jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: {
        ENCRYPTION_KEY: 'a'.repeat(64),
        TWITCH_CLIENT_SECRET: 'test-client-secret-for-legacy-key'
    }
}));

import { describe, expect, it } from '@jest/globals';
import { encrypt, decrypt } from '../../backend/src/core/database/cryptoService';

describe('cryptoService', () => {
    it('encrypts and decrypts with AES-256-GCM format', () => {
        const plain = 'secret_refresh_token_123';
        const cipher = encrypt(plain);
        expect(cipher.startsWith('gcm:')).toBe(true);
        expect(decrypt(cipher)).toBe(plain);
    });
});
