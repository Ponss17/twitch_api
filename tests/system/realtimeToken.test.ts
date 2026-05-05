import { Response } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

jest.mock('@/core/database/dbService', () => ({
    getUser: jest.fn()
}));

jest.mock('@/core/config/env', () => ({
    CONFIG: { SUPABASE_JWT_SECRET: 'test-secret' }
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token')
}));

import { generateRealtimeToken } from '../../src/features/system/system.controller';
import * as dbService from '../../src/core/database/dbService';
import { AuthenticatedRequest } from '../../src/types/twitch';

const mockReq = (overrides = {}) =>
    ({ userId: '12345', login: 'testuser', ...overrides }) as unknown as AuthenticatedRequest;

const mockRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.locals = { requestId: 'test-req-id' };
    return res;
};

describe('generateRealtimeToken', () => {
    beforeEach(() => jest.clearAllMocks());

    it('debería retornar 401 si no hay userId', async () => {
        const req = mockReq({ userId: undefined });
        const res = mockRes();
        await generateRealtimeToken(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debería retornar 404 si el usuario no existe en DB', async () => {
        (dbService.getUser as jest.Mock).mockResolvedValue(null);
        const req = mockReq();
        const res = mockRes();
        await generateRealtimeToken(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería generar un token JWT válido', async () => {
        (dbService.getUser as jest.Mock).mockResolvedValue({ login: 'testuser' });
        const req = mockReq();
        const res = mockRes();
        await generateRealtimeToken(req, res);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'mock.jwt.token',
                expiresIn: 300
            })
        );
    });

    it('debería retornar 500 si jwt.sign falla', async () => {
        (dbService.getUser as jest.Mock).mockResolvedValue({ login: 'testuser' });
        (jwt.sign as jest.Mock).mockImplementationOnce(() => {
            throw new Error('sign failed');
        });
        const req = mockReq();
        const res = mockRes();
        await generateRealtimeToken(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
