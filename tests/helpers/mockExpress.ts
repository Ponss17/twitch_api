import { Response } from 'express';
import { AuthenticatedRequest } from '../../backend/src/types/twitch';

type MockRes = Response & {
    locals: Record<string, unknown>;
};

export function mockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
    return {
        query: {},
        body: {},
        params: {},
        headers: {},
        path: '/api/test',
        method: 'GET',
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        get: jest.fn(),
        accepts: jest.fn().mockReturnValue('json'),
        ...overrides
    } as unknown as AuthenticatedRequest;
}

export function mockRes(overrides: Partial<MockRes> = {}): MockRes {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
        locals: {},
        ...overrides
    } as unknown as MockRes;
    return res;
}

export function mockNext(): jest.Mock {
    return jest.fn();
}
