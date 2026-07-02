import { Response } from 'express';

jest.mock('../../backend/src/core/database/cacheService', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../backend/src/features/auth/auth.service', () => ({
    signOverlayReadToken: jest.fn().mockReturnValue('signed_overlay_token')
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

import * as cacheService from '../../backend/src/core/database/cacheService';
import {
    getOverlayState,
    putOverlayState,
    createOverlayLink
} from '../../backend/src/features/dashboard/overlay/controller';
import { AuthenticatedRequest } from '@/types/twitch';

const mockReq = (overrides = {}) =>
    ({
        userId: 'user-123',
        login: 'streamer',
        params: { tool: 'roulette' },
        body: {},
        ...overrides
    }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.locals = {};
    return res;
};

describe('overlay state controller', () => {
    beforeEach(() => jest.clearAllMocks());

    it('getOverlayState returns null when no cache', async () => {
        const req = mockReq();
        const res = mockRes();

        await getOverlayState(req, res);

        expect(cacheService.get).toHaveBeenCalledWith('overlay:state:user-123:roulette');
        expect(res.json).toHaveBeenCalledWith({ state: null });
    });

    it('getOverlayState returns cached state', async () => {
        const state = { chatters: [], spinSeq: 0 };
        (cacheService.get as jest.Mock).mockResolvedValueOnce(state);

        const req = mockReq();
        const res = mockRes();

        await getOverlayState(req, res);

        expect(res.json).toHaveBeenCalledWith({ state });
    });

    it('putOverlayState saves with TTL', async () => {
        const req = mockReq({
            body: { state: { chatters: [{ user_login: 'a', user_name: 'A' }], spinSeq: 1 } }
        });
        const res = mockRes();

        await putOverlayState(req, res);

        expect(cacheService.set).toHaveBeenCalledWith(
            'overlay:state:user-123:roulette',
            expect.objectContaining({ spinSeq: 1, updatedAt: expect.any(Number) }),
            7200
        );
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('createOverlayLink returns overlay URL with overlayToken', async () => {
        const req = mockReq({
            body: { tool: 'trends' }
        });
        const res = mockRes();
        res.locals = {
            apiUser: {
                apiKey: 'key-abc',
                login: 'streamer',
                displayName: 'Streamer'
            }
        };

        await createOverlayLink(req, res);

        expect(res.json).toHaveBeenCalledWith({
            url: expect.stringContaining('/overlay/trends')
        });
        expect(res.json).toHaveBeenCalledWith({
            url: expect.stringContaining('overlayToken=signed_overlay_token')
        });
    });

    it('putOverlayState rejects overlay read token', async () => {
        const req = mockReq({
            body: { state: { chatters: [], spinSeq: 1 } }
        });
        const res = mockRes();
        res.locals = { isOverlayReadRequest: true };

        await putOverlayState(req, res);

        expect(cacheService.set).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('putOverlayState rejects apiKey from bots without panel origin', async () => {
        const req = mockReq({
            body: { state: { wordCounts: {}, tracking: true } }
        });
        const res = mockRes();
        res.locals = { isApiKeyRequest: true };

        await putOverlayState(req, res);

        expect(cacheService.set).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('putOverlayState allows apiKey from panel browser with allowed origin', async () => {
        const req = mockReq({
            body: { state: { wordCounts: {}, tracking: true } },
            headers: { origin: 'https://www.losperris.dev' }
        });
        const res = mockRes();
        res.locals = { isApiKeyRequest: true };

        await putOverlayState(req, res);

        expect(cacheService.set).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ success: true });
    });
});
