jest.mock('@/core/config/config', () => ({
    API_ENDPOINTS: {
        VALIDATE: '/api/twitch/system/validate',
        AUTH_LOGIN: '/api/twitch/auth/twitch',
        AUTH_EXCHANGE: '/api/twitch/auth/exchange',
        TIMEZONE: '/api/twitch/dashboard/timezone'
    }
}));

import { getSession, resolveSessionFromUrl, saveSession, stripSensitiveQueryParams } from '@/core/api/auth';

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
