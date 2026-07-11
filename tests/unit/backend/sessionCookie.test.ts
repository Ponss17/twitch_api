import {
    createSessionCookieValue,
    verifySessionCookieValue,
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
});
