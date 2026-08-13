import {
    setOAuthStateCookie,
    readOAuthStateCookie,
    clearOAuthStateCookie,
    OAUTH_STATE_COOKIE_NAME
} from '../../../backend/src/core/utils/oauthStateCookie';

describe('oauthStateCookie', () => {
    it('stores encrypted state and reads it back', () => {
        const cookie = jest.fn();
        const res = { cookie } as unknown as import('express').Response;
        setOAuthStateCookie(res, 'signed-browser-state');

        expect(cookie).toHaveBeenCalledWith(
            OAUTH_STATE_COOKIE_NAME,
            expect.stringMatching(/^v1\./),
            expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true })
        );

        const encrypted = cookie.mock.calls[0][1] as string;
        expect(encrypted).not.toContain('signed-browser-state');

        const req = {
            headers: { cookie: `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(encrypted)}` }
        } as unknown as import('express').Request;

        expect(readOAuthStateCookie(req)).toBe('signed-browser-state');
    });

    it('returns null for tampered ciphertext', () => {
        const cookie = jest.fn();
        setOAuthStateCookie({ cookie } as unknown as import('express').Response, 'ok-state');
        const encrypted = cookie.mock.calls[0][1] as string;
        const req = {
            headers: { cookie: `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(`${encrypted}x`)}` }
        } as unknown as import('express').Request;
        expect(readOAuthStateCookie(req)).toBeNull();
    });

    it('clears cookie via res.clearCookie', () => {
        const clearCookie = jest.fn();
        clearOAuthStateCookie({ clearCookie } as unknown as import('express').Response);
        expect(clearCookie).toHaveBeenCalledWith(
            OAUTH_STATE_COOKIE_NAME,
            expect.objectContaining({ path: '/', httpOnly: true, maxAge: 0 })
        );
    });
});
