import {
    clearOverlayStoredSession,
    getOverlayStoredSession,
    readOverlayOptimisticAuthState,
    resolveOverlaySessionFromUrl,
    saveOverlayStoredSession
} from '@/features/overlay/lib/overlaySession';

describe('overlaySession', () => {
    beforeEach(() => {
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
    });

    it('resolveOverlaySessionFromUrl ignora apiKey legacy', async () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?apiKey=obs_key');

        const session = await resolveOverlaySessionFromUrl();

        expect(session).toEqual({});
    });

    it('resolveOverlaySessionFromUrl sin query no inventa sesión', async () => {
        const session = await resolveOverlaySessionFromUrl();
        expect(session).toEqual({});
    });

    it('readOverlayOptimisticAuthState rechaza apiKey en query', () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?apiKey=obs_key');

        expect(readOverlayOptimisticAuthState()).toEqual({
            session: null,
            loading: false,
            authenticated: false
        });
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
});
