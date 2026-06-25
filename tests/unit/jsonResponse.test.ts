import { jsonError, parseApiErrorBody, httpStatusToErrorCode } from '../../backend/src/core/utils/jsonResponse';
import { isJsonApiRoute } from '../../backend/src/core/utils/routeHelpers';

describe('jsonResponse', () => {
    describe('httpStatusToErrorCode', () => {
        it('maps common HTTP statuses', () => {
            expect(httpStatusToErrorCode(401)).toBe('UNAUTHORIZED');
            expect(httpStatusToErrorCode(429)).toBe('RATE_LIMITED');
            expect(httpStatusToErrorCode(503)).toBe('SERVICE_UNAVAILABLE');
        });
    });

    describe('parseApiErrorBody', () => {
        it('reads unified error shape', () => {
            expect(
                parseApiErrorBody({
                    success: false,
                    error: { message: 'No autorizado', code: 'UNAUTHORIZED' }
                })
            ).toBe('No autorizado');
        });

        it('reads legacy { error: string }', () => {
            expect(parseApiErrorBody({ error: 'Legacy' })).toBe('Legacy');
        });
    });

    describe('jsonError', () => {
        it('returns structured JSON body', () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
                setHeader: jest.fn()
            };

            jsonError(res as never, 401, 'Sesión requerida', { code: 'UNAUTHORIZED' });

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    message: 'Sesión requerida',
                    code: 'UNAUTHORIZED'
                }
            });
        });
    });
});

describe('isJsonApiRoute', () => {
    it('includes dashboard and system routes', () => {
        expect(isJsonApiRoute('/api/twitch/dashboard/analytics')).toBe(true);
        expect(isJsonApiRoute('/api/twitch/system/validate')).toBe(true);
        expect(isJsonApiRoute('/api/twitch/auth/exchange')).toBe(true);
    });

    it('excludes bot commands and minigames', () => {
        expect(isJsonApiRoute('/api/twitch/followage')).toBe(false);
        expect(isJsonApiRoute('/api/twitch/minigames/magic8')).toBe(false);
    });
});
