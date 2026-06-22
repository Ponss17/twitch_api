import { Response } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

// dbService ya no es usado en generateRealtimeToken — el usuario viene de res.locals.apiUser
jest.mock('@/core/database/dbService', () => ({}));

jest.mock('@/core/config/env', () => ({
    CONFIG: { SUPABASE_JWT_SECRET: 'test-secret' }
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token')
}));

import { generateRealtimeToken } from '../../backend/src/features/system/system.controller';
import { AuthenticatedRequest } from '../../backend/src/types/twitch';

const mockReq = (overrides = {}) =>
    ({ userId: '12345', login: 'testuser', ...overrides }) as unknown as AuthenticatedRequest;

/**
 * El usuario ya viene validado en res.locals.apiUser (puesto por checkToken).
 * Los tests deben simular ese escenario, no mockear dbService.
 */
const mockRes = (apiUser: Record<string, unknown> | null = { login: 'testuser' }) => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.locals = { requestId: 'test-req-id', apiUser };
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

    it('debería retornar 401 si res.locals.apiUser es null (no autenticado)', async () => {
        const req = mockReq();
        const res = mockRes(null); // sin apiUser en locals
        await generateRealtimeToken(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('debería generar un token JWT válido con expiresIn de 15 minutos', async () => {
        const req = mockReq();
        const res = mockRes({ login: 'testuser' });
        await generateRealtimeToken(req, res);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                token: 'mock.jwt.token',
                expiresIn: 900 // 15 minutos (antes era 300)
            })
        );
    });

    it('debería retornar 500 si jwt.sign falla', async () => {
        (jwt.sign as jest.Mock).mockImplementationOnce(() => {
            throw new Error('sign failed');
        });
        const req = mockReq();
        const res = mockRes({ login: 'testuser' });
        await generateRealtimeToken(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});
