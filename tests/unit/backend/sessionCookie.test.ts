import {
    createSessionCookieValue,
    verifySessionCookieValue,
    setSessionCookie,
    clearSessionCookie,
    SESSION_COOKIE_NAME
} from '../../../backend/src/core/utils/sessionCookie';

describe('sessionCookie', () => {
    it('creates and verifies a signed session cookie', () => {
        const value = createSessionCookieValue('user-123');
        expect(value.includes('.')).toBe(true);
        expect(verifySessionCookieValue(value)).toBe('user-123');
    });

    it('rejects tampered cookies', () => {
        const value = createSessionCookieValue('user-123');
        expect(verifySessionCookieValue(`${value}x`)).toBeNull();
    });

    it('exports stable cookie name', () => {
        expect(SESSION_COOKIE_NAME).toBe('lp_sess');
    });

    it('sets cookie via res.cookie (Vercel-safe)', () => {
        const cookie = jest.fn();
        const res = { cookie } as unknown as import('express').Response;
        setSessionCookie(res, 'user-123');
        expect(cookie).toHaveBeenCalledWith(
            SESSION_COOKIE_NAME,
            expect.stringContaining('.'),
            expect.objectContaining({
                path: '/',
                httpOnly: true,
                sameSite: 'lax'
            })
        );
    });

    it('clears cookie via res.clearCookie', () => {
        const clearCookie = jest.fn();
        const res = { clearCookie } as unknown as import('express').Response;
        clearSessionCookie(res);
        expect(clearCookie).toHaveBeenCalledWith(
            SESSION_COOKIE_NAME,
            expect.objectContaining({ path: '/', httpOnly: true, maxAge: 0 })
        );
    });
});
