import { redactSensitiveUrl } from '../../backend/src/core/utils/redactSensitiveUrl';

describe('redactSensitiveUrl', () => {
    it('redacts apiKey, auth, overlayToken and code', () => {
        const url =
            '/api/auth/exchange?auth=secretauth&overlayToken=ovl&code=oauth&apiKey=uuid-here&ok=1';
        const safe = redactSensitiveUrl(url);
        expect(safe).toContain('auth=[REDACTED]');
        expect(safe).toContain('overlayToken=[REDACTED]');
        expect(safe).toContain('code=[REDACTED]');
        expect(safe).toContain('apiKey=[REDACTED]');
        expect(safe).toContain('ok=1');
        expect(safe).not.toContain('secretauth');
    });

    it('leaves paths without secrets unchanged', () => {
        expect(redactSensitiveUrl('/api/health')).toBe('/api/health');
    });
});
