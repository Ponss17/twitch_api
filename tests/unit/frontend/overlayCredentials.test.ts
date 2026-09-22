import {
    hasOverlayPollCredentials,
    overlaySessionKey,
    resolveOverlayPollSession
} from '@/features/overlay/lib/credentials';
import {
    clearOverlayStoredSession,
    saveOverlayStoredSession
} from '@/features/overlay/lib/overlaySession';

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

    it('hasOverlayPollCredentials solo acepta overlayToken', () => {
        expect(hasOverlayPollCredentials(null)).toBe(false);
        expect(hasOverlayPollCredentials({ overlayToken: 'abc' })).toBe(true);
        expect(hasOverlayPollCredentials({ apiKey: 'key' })).toBe(false);
    });

    it('overlaySessionKey usa solo overlayToken', () => {
        expect(overlaySessionKey({ overlayToken: 'abc' })).toBe('abc');
        expect(overlaySessionKey({ apiKey: 'key' })).toBe('');
    });
});
