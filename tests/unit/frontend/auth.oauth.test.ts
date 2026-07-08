jest.mock('@/core/config/config', () => ({
    API_ENDPOINTS: {
        VALIDATE: '/api/twitch/system/validate',
        AUTH_LOGIN: '/api/twitch/auth/twitch',
        AUTH_EXCHANGE: '/api/twitch/auth/exchange',
        TIMEZONE: '/api/twitch/dashboard/timezone'
    }
}));

import { getSession, resolveSessionFromUrl, saveSession, stripSensitiveQueryParams, validateSession } from '@/core/api/auth';
import { sessionFingerprint } from '@/core/session/localPrefs';

describe('resolveSessionFromUrl', () => {
    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, '', '/api/twitch/dashboard');
        global.fetch = jest.fn();
    });

    it('returns stored session when no auth token is in the URL', async () => {
        saveSession({ apiKey: 'stored_key', login: 'streamer' });

        const session = await resolveSessionFromUrl();

        expect(session).toEqual({
            login: 'streamer',
            displayName: '',
            profile_image_url: '',
            token: undefined,
            apiKey: 'stored_key',
            userId: undefined,
            isNewLogin: false
        });
    });

    it('exchanges auth token and strips sensitive query params', async () => {
        window.history.replaceState({}, '', '/api/twitch/dashboard?auth=signed');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                apiKey: 'new_key',
                login: 'streamer',
                displayName: 'Streamer',
                userId: '42'
            })
        });

        const session = await resolveSessionFromUrl();

        expect(session.isNewLogin).toBe(true);
        expect(session.apiKey).toBe('new_key');
        expect(window.location.search).toBe('');
    });
});

describe('stripSensitiveQueryParams', () => {
    it('removes legacy credential params from the URL', () => {
        window.history.replaceState(
            {},
            '',
            '/api/twitch/dashboard?apiKey=test_key&token=legacy&login=streamer'
        );

        stripSensitiveQueryParams();

        expect(window.location.pathname).toBe('/api/twitch/dashboard');
        expect(window.location.search).toBe('');
        expect(getSession()).toBeNull();
    });
});

describe('validateSession cache', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    it('persists validate cache without apiKey or token', async () => {
        const session = { apiKey: 'secret-key', userId: '205997464', login: 'ponss' };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                valid: true,
                apiKey: 'secret-key',
                user: { id: '205997464', login: 'ponss' }
            })
        });

        await validateSession(session);

        const cacheKey = `twitch_validate_cache_${sessionFingerprint(session)}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey)!) as {
            result: { apiKey?: string; token?: string; valid?: boolean };
        };

        expect(cached.result.valid).toBe(true);
        expect(cached.result.apiKey).toBeUndefined();
        expect(cached.result.token).toBeUndefined();
        expect(getSession()?.apiKey).toBe('secret-key');
    });

    it('dedupes concurrent validate calls for the same session', async () => {
        const session = { apiKey: 'secret-key', userId: '205997464', login: 'ponss' };
        let resolveFetch: (value: unknown) => void = () => {};
        (global.fetch as jest.Mock).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFetch = resolve;
                })
        );

        const first = validateSession(session);
        const second = validateSession(session);

        expect(global.fetch).toHaveBeenCalledTimes(1);

        resolveFetch({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
                valid: true,
                apiKey: 'secret-key',
                user: { id: '205997464', login: 'ponss' }
            })
        });

        const [a, b] = await Promise.all([first, second]);
        expect(a.valid).toBe(true);
        expect(b.valid).toBe(true);
    });

    it('sanitizes legacy cache entries on read', async () => {
        const session = { apiKey: 'secret-key', userId: '205997464' };
        const cacheKey = `twitch_validate_cache_${sessionFingerprint(session)}`;

        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                at: Date.now(),
                result: {
                    valid: true,
                    apiKey: 'leaked-from-old-cache',
                    user: { id: '205997464' }
                }
            })
        );

        const result = await validateSession(session);

        expect(result.valid).toBe(true);
        expect(result.apiKey).toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
