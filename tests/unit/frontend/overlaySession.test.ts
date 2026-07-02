jest.mock('@/core/api/auth', () => ({
    getSession: jest.fn(),
    resolveSessionFromUrl: jest.fn(),
    stripSensitiveQueryParams: jest.fn()
}));

import { getSession, resolveSessionFromUrl, stripSensitiveQueryParams } from '@/core/api/auth';
import {
    readOverlayOptimisticAuthState,
    resolveOverlaySessionFromUrl
} from '@/features/tools/overlay/lib/overlaySession';

describe('overlaySession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.history.replaceState({}, '', '/api/twitch/overlay/trends');
    });

    it('readOverlayOptimisticAuthState espera mientras hay apiKey en la URL', () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?apiKey=test_key');

        expect(readOverlayOptimisticAuthState()).toEqual({
            session: null,
            loading: true,
            authenticated: false
        });
    });

    it('resolveOverlaySessionFromUrl lee apiKey y limpia la URL', async () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?apiKey=obs_key');

        const session = await resolveOverlaySessionFromUrl();

        expect(stripSensitiveQueryParams).toHaveBeenCalled();
        expect(session).toEqual({
            apiKey: 'obs_key',
            login: '',
            displayName: '',
            isNewLogin: true
        });
        expect(resolveSessionFromUrl).not.toHaveBeenCalled();
    });

    it('resolveOverlaySessionFromUrl delega en auth cuando no hay apiKey', async () => {
        (resolveSessionFromUrl as jest.Mock).mockResolvedValue({
            apiKey: 'stored',
            login: 'streamer',
            isNewLogin: false
        });

        const session = await resolveOverlaySessionFromUrl();

        expect(resolveSessionFromUrl).toHaveBeenCalled();
        expect(session.apiKey).toBe('stored');
    });

    it('readOverlayOptimisticAuthState usa sesión guardada sin query', () => {
        (getSession as jest.Mock).mockReturnValue({ apiKey: 'stored', login: 'streamer' });

        expect(readOverlayOptimisticAuthState()).toEqual({
            session: { apiKey: 'stored', login: 'streamer' },
            loading: false,
            authenticated: true
        });
    });
});
