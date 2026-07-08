describe('production URL resolution (Vercel)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('ignora TWITCH_REDIRECT_URI localhost en Vercel', async () => {
        process.env.VERCEL = '1';
        process.env.NODE_ENV = 'production';
        process.env.TWITCH_CLIENT_ID = 'id';
        process.env.TWITCH_CLIENT_SECRET = 'secret';
        process.env.ENCRYPTION_KEY = 'a'.repeat(64);
        process.env.HMAC_SIGNING_SECRET = 'b'.repeat(64);
        process.env.TWITCH_REDIRECT_URI = 'http://localhost:3000/api/twitch/auth/twitch/callback';
        process.env.BASE_URL = 'http://localhost:3000/api/twitch';
        process.env.FRONTEND_URL = 'http://localhost:4321';
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
        process.env.SUPABASE_ANON_KEY = 'anon';
        process.env.SUPABASE_JWT_SECRET = 'jwt';

        const { CONFIG } = await import('../../backend/src/core/config/env');
        expect(CONFIG.TWITCH_REDIRECT_URI).toBe(
            'https://ttv.losperris.dev/api/auth/twitch/callback'
        );
        expect(CONFIG.BASE_URL).toBe('https://ttv.losperris.dev/api');
        expect(CONFIG.FRONTEND_URL).toBe('https://ttv.losperris.dev');
    });

    it('deriva FRONTEND_URL del BASE_URL si no existe en Vercel', async () => {
        process.env.VERCEL = '1';
        process.env.NODE_ENV = 'production';
        process.env.TWITCH_CLIENT_ID = 'id';
        process.env.TWITCH_CLIENT_SECRET = 'secret';
        process.env.ENCRYPTION_KEY = 'a'.repeat(64);
        process.env.HMAC_SIGNING_SECRET = 'b'.repeat(64);
        process.env.TWITCH_REDIRECT_URI = 'http://localhost:3000/api/twitch/auth/twitch/callback';
        process.env.BASE_URL = 'http://localhost:3000/api/twitch';
        delete process.env.FRONTEND_URL;
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
        process.env.SUPABASE_ANON_KEY = 'anon';
        process.env.SUPABASE_JWT_SECRET = 'jwt';

        const { CONFIG } = await import('../../backend/src/core/config/env');
        expect(CONFIG.FRONTEND_URL).toBe('https://ttv.losperris.dev');
    });
});
