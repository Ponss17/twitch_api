import { requireCookieSession } from '../../backend/src/core/middleware/requireCookieSession';

describe('requireCookieSession', () => {
    const next = jest.fn();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    beforeEach(() => {
        next.mockClear();
        json.mockClear();
        status.mockClear();
    });

    it('allows cookie sessions', () => {
        const res = {
            locals: { isCookieSession: true, authSource: 'cookie' },
            status
        } as never;
        requireCookieSession({} as never, res, next);
        expect(next).toHaveBeenCalled();
        expect(status).not.toHaveBeenCalled();
    });

    it('rejects API key sessions', () => {
        const res = {
            locals: { isCookieSession: false, authSource: 'apiKey', isApiKeyRequest: true },
            status
        } as never;
        requireCookieSession({} as never, res, next);
        expect(next).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(403);
    });
});
