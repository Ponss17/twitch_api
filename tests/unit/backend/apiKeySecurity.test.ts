describe('apiKeySecurity', () => {
    const previous = process.env.PREVIOUS_HMAC_SIGNING_SECRET;

    afterEach(() => {
        if (previous === undefined) delete process.env.PREVIOUS_HMAC_SIGNING_SECRET;
        else process.env.PREVIOUS_HMAC_SIGNING_SECRET = previous;
        jest.resetModules();
    });

    it('normalizes compact 32-hex keys to UUID form', async () => {
        const { normalizeApiKey } = await import(
            '../../../backend/src/core/utils/apiKeySecurity'
        );
        expect(normalizeApiKey('AAAAAAAAAAAA4AAA8AAAAAAAAAAAAAAA')).toBe(
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        );
    });

    it('includes previous HMAC secret in lookup hashes', async () => {
        process.env.PREVIOUS_HMAC_SIGNING_SECRET = 'b'.repeat(64);
        jest.resetModules();
        const { apiKeyLookupHash, apiKeyLookupHashes } = await import(
            '../../../backend/src/core/utils/apiKeySecurity'
        );
        const { getHmacSecrets } = await import('../../../backend/src/core/utils/hmacSecrets');

        const key = '44444444-4444-4444-8444-444444444444';
        const hashes = apiKeyLookupHashes(key);
        const secrets = getHmacSecrets();

        expect(secrets.length).toBeGreaterThanOrEqual(2);
        expect(hashes).toHaveLength(secrets.length);
        expect(new Set(hashes).size).toBe(hashes.length);
        expect(hashes[0]).toBe(apiKeyLookupHash(key));
        expect(hashes[0]).toMatch(/^[a-f0-9]{64}$/);
    });

    it('marks plaintext stored keys as legacy', async () => {
        const { decryptStoredApiKey, encryptApiKey } = await import(
            '../../../backend/src/core/utils/apiKeySecurity'
        );
        const raw = '55555555-5555-4555-8555-555555555555';
        expect(decryptStoredApiKey(raw).legacy).toBe(true);
        expect(decryptStoredApiKey(encryptApiKey(raw)).legacy).toBe(false);
    });
});
