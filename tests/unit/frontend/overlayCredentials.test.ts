import {
    hasOverlayPollCredentials,
    overlaySessionKey,
    resolveOverlayPollSession
} from '@/features/tools/overlay/lib/credentials';
import {
    clearOverlayStoredSession,
    saveOverlayStoredSession
} from '@/features/tools/overlay/lib/overlaySession';

describe('overlay credentials', () => {
    beforeEach(() => {
        clearOverlayStoredSession();
        window.history.replaceState({}, '', '/api/twitch/overlay/trends');
    });

    it('resolveOverlayPollSession prioriza overlayToken de la URL', () => {
        window.history.replaceState({}, '', '/api/twitch/overlay/trends?overlayToken=url_token');

        expect(resolveOverlayPollSession()).toMatchObject({
            overlayToken: 'url_token'
        });
    });

    it('resolveOverlayPollSession usa sessionStorage como respaldo', () => {
        saveOverlayStoredSession({ overlayToken: 'stored_token', login: 'streamer' });

        expect(resolveOverlayPollSession()).toMatchObject({
            overlayToken: 'stored_token',
            login: 'streamer'
        });
    });

    it('hasOverlayPollCredentials detecta credenciales válidas', () => {
        expect(hasOverlayPollCredentials(null)).toBe(false);
        expect(hasOverlayPollCredentials({ overlayToken: 'abc' })).toBe(true);
        expect(hasOverlayPollCredentials({ apiKey: 'key' })).toBe(true);
    });

    it('overlaySessionKey estabiliza la identidad de sesión', () => {
        expect(overlaySessionKey({ overlayToken: 'abc' })).toBe('abc||');
        expect(overlaySessionKey({ apiKey: 'key' })).toBe('|key|');
    });
});
