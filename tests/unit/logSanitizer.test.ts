import { sanitizeLogValue } from '../../backend/src/core/utils/logSanitizer';

describe('logSanitizer', () => {
    it('redacts nested headers, secrets and URL credentials', () => {
        const input = {
            headers: {
                authorization: 'Bearer private',
                Cookie: 'session=private',
                'set-cookie': ['session=private'],
                apiKey: 'private'
            },
            nested: {
                client_secret: 'private',
                url: 'https://user:pass@example.com/callback?token=private&safe=yes'
            }
        };

        expect(sanitizeLogValue(input)).toEqual({
            headers: {
                authorization: '[REDACTED]',
                Cookie: '[REDACTED]',
                'set-cookie': '[REDACTED]',
                apiKey: '[REDACTED]'
            },
            nested: {
                client_secret: '[REDACTED]',
                url: 'https://%5BREDACTED%5D:%5BREDACTED%5D@example.com/callback?token=[REDACTED]&safe=yes'
            }
        });
    });

    it('serializes AxiosError using an explicit allow-list', () => {
        const request: Record<string, unknown> = {};
        request.self = request;
        const error = {
            name: 'AxiosError',
            isAxiosError: true,
            message: 'request failed',
            code: 'ERR_BAD_RESPONSE',
            config: {
                method: 'get',
                url: 'https://api.example.test/users?apiKey=private',
                headers: { authorization: 'private' }
            },
            response: {
                status: 502,
                data: { token: 'private', reason: 'upstream' }
            },
            request
        };

        expect(sanitizeLogValue(error)).toEqual({
            name: 'AxiosError',
            message: 'request failed',
            code: 'ERR_BAD_RESPONSE',
            status: 502,
            method: 'get',
            url: 'https://api.example.test/users?apiKey=[REDACTED]',
            responseData: { token: '[REDACTED]', reason: 'upstream' }
        });
    });

    it('handles ordinary circular objects', () => {
        const value: Record<string, unknown> = { safe: true };
        value.self = value;
        expect(sanitizeLogValue(value)).toEqual({ safe: true, self: '[Circular]' });
    });
});
