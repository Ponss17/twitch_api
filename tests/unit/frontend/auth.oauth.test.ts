jest.mock('@/lib/config', () => ({
    API_ENDPOINTS: {
        VALIDATE: '/api/twitch/system/validate',
        AUTH_LOGIN: '/api/twitch/auth/twitch',
        AUTH_EXCHANGE: '/api/twitch/auth/exchange',
        TIMEZONE: '/api/twitch/dashboard/timezone'
    }
}));

import { applyOAuthParamsFromUrl, getSession, saveSession } from '@/lib/auth';

const SESSION_KEY = 'twitch_api_session';

describe('applyOAuthParamsFromUrl', () => {
    beforeEach(() => {
        localStorage.clear();
        window.history.replaceState({}, '', '/api/twitch/dashboard');
    });

    it('returns false when no oauth params are present', () => {
        expect(applyOAuthParamsFromUrl()).toBe(false);
        expect(getSession()).toBeNull();
    });

    it('persists session from query params and strips the URL', () => {
        window.history.replaceState(
            {},
            '',
            '/api/twitch/dashboard?apiKey=test_key&login=streamer&displayName=Streamer&userId=42'
        );

        expect(applyOAuthParamsFromUrl()).toBe(true);

        expect(getSession()).toEqual({
            apiKey: 'test_key',
            login: 'streamer',
            displayName: 'Streamer',
            userId: '42',
            profile_image_url: '',
            isNewLogin: true
        });
        expect(window.location.pathname).toBe('/api/twitch/dashboard');
        expect(window.location.search).toBe('');
    });

    it('merges with an existing session', () => {
        saveSession({ apiKey: 'old', login: 'oldlogin' });
        window.history.replaceState({}, '', '/api/twitch/dashboard?apiKey=new_key&displayName=NewName');

        expect(applyOAuthParamsFromUrl()).toBe(true);

        expect(getSession()).toEqual({
            apiKey: 'new_key',
            login: 'oldlogin',
            displayName: 'NewName',
            profile_image_url: '',
            isNewLogin: true
        });
        expect(localStorage.getItem(SESSION_KEY)).toContain('new_key');
    });
});
