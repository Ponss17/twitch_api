jest.mock('@/core/api/auth', () => ({
    resolveSessionFromUrl: jest.fn(),
    stripSensitiveQueryParams: jest.fn()
}));

import { resolveSessionFromUrl, stripSensitiveQueryParams } from '@/core/api/auth';
import {
    clearOverlayStoredSession,
    getOverlayStoredSession,
    readOverlayOptimisticAuthState,
    resolveOverlaySessionFromUrl,
    saveOverlayStoredSession
} from '@/features/tools/overlay/lib/overlaySession';

describe('overlaySession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearOverlayStoredSession();
        window.history.replaceState({}, '', '/api/twitch/overlay/trends');
    });

    it('readOverlayOptimisticAuthState permite poll inmediato con overlayToken en la URL', () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?overlayToken=test_token');

        expect(readOverlayOptimisticAuthState()).toEqual({
            session: { overlayToken: 'test_token', login: '', displayName: '', isNewLogin: true },
            loading: true,
            authenticated: true
        });
    });

    it('resolveOverlaySessionFromUrl lee overlayToken de la URL', async () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?overlayToken=obs_token');

        const session = await resolveOverlaySessionFromUrl();

        expect(session).toEqual({
            overlayToken: 'obs_token',
            login: '',
            displayName: '',
            isNewLogin: true
        });
        expect(resolveSessionFromUrl).not.toHaveBeenCalled();
    });

    it('resolveOverlaySessionFromUrl lee apiKey legacy sin delegar en auth', async () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?apiKey=obs_key');

        const session = await resolveOverlaySessionFromUrl();

        expect(session).toEqual({
            apiKey: 'obs_key',
            login: '',
            displayName: '',
            isNewLogin: true
        });
        expect(resolveSessionFromUrl).not.toHaveBeenCalled();
    });

    it('resolveOverlaySessionFromUrl delega en auth cuando no hay credenciales en query', async () => {
        (resolveSessionFromUrl as jest.Mock).mockResolvedValue({
            apiKey: 'stored',
            login: 'streamer',
            isNewLogin: false
        });

        const session = await resolveOverlaySessionFromUrl();

        expect(resolveSessionFromUrl).toHaveBeenCalled();
        expect(session.apiKey).toBe('stored');
    });

    it('readOverlayOptimisticAuthState usa sesión guardada en sessionStorage', () => {
        saveOverlayStoredSession({ overlayToken: 'stored_token', login: 'streamer' });

        expect(readOverlayOptimisticAuthState()).toEqual({
            session: { overlayToken: 'stored_token', login: 'streamer' },
            loading: false,
            authenticated: true
        });
        expect(getOverlayStoredSession()).toEqual({
            overlayToken: 'stored_token',
            login: 'streamer'
        });
    });

    it('resolveOverlaySessionFromUrl legacy auth limpia la URL', async () => {
        (resolveSessionFromUrl as jest.Mock).mockResolvedValue({
            apiKey: 'from_auth',
            login: 'streamer',
            isNewLogin: true
        });

        await resolveOverlaySessionFromUrl();

        expect(stripSensitiveQueryParams).toHaveBeenCalled();
    });
});
