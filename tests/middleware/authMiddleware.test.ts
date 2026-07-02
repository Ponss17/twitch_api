const mockValidateToken = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateLastActive = jest.fn().mockResolvedValue(undefined);

jest.mock('../../backend/src/features/twitch/twitch.service', () => ({
    validateToken: mockValidateToken
}));

jest.mock('../../backend/src/core/database/dbService', () => ({
    getUser: mockGetUser,
    updateLastActive: mockUpdateLastActive
}));

jest.mock('@/core/utils/routeHelpers', () => ({
    isPublicRoute: jest.fn().mockReturnValue(false),
    isBotCommand: jest.fn().mockReturnValue(false),
    isApiRoute: jest.fn((path: string) => path.startsWith('/api') || path.startsWith('/twitch')),
    isJsonApiRoute: jest.fn((path: string) => path.includes('/dashboard/'))
}));

import checkToken from '../../backend/src/core/middleware/authMiddleware';
import { mockRes, mockReq } from '../helpers/mockExpress';

describe('authMiddleware — checkToken', () => {
    let next: jest.Mock;

    beforeEach(() => {
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('permite el paso directamente si apiUser ya está en res.locals', async () => {
        const res = mockRes();
        res.locals.apiUser = {
            userId: 'u1',
            login: 'streamer',
            displayName: 'S',
            accessToken: 'tok'
        };

        const req = mockReq();
        await checkToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(mockValidateToken).not.toHaveBeenCalled();
    });

    it('rechaza con 401 si no hay token en una ruta privada', async () => {
        const res = mockRes();
        const req = mockReq({ path: '/api/data' });

        await checkToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('permite el paso con un token válido en query', async () => {
        const res = mockRes();
        const req = mockReq({ query: { token: 'valid_token' } });

        mockValidateToken.mockResolvedValue({ user_id: 'u2', login: 'strm2' });
        mockGetUser.mockResolvedValue({ userId: 'u2', login: 'strm2', isActive: true });

        await checkToken(req, res, next);

        expect(mockValidateToken).toHaveBeenCalledWith('valid_token');
        expect(next).toHaveBeenCalled();
    });

    it('rechaza con 401 si el token es inválido', async () => {
        const res = mockRes();
        const req = mockReq({ query: { token: 'bad_token' } });

        mockValidateToken.mockResolvedValue(null);

        await checkToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('usa caché negativa y rechaza inmediatamente el mismo token inválido', async () => {
        const res1 = mockRes();
        const res2 = mockRes();
        const req1 = mockReq({ query: { token: 'cached_bad' } });
        const req2 = mockReq({ query: { token: 'cached_bad' } });

        mockValidateToken.mockResolvedValue(null);

        await checkToken(req1, res1, jest.fn());
        jest.clearAllMocks();

        await checkToken(req2, res2, jest.fn());

        expect(mockValidateToken).not.toHaveBeenCalled();
        expect(res2.status).toHaveBeenCalledWith(401);
    });

    it('acepta token vía Authorization Bearer header', async () => {
        const res = mockRes();
        const req = mockReq({ headers: { authorization: 'Bearer bearer_token' } });

        mockValidateToken.mockResolvedValue({ user_id: 'u3', login: 'strm3' });
        mockGetUser.mockResolvedValue({ userId: 'u3', login: 'strm3', isActive: true });

        await checkToken(req, res, next);

        expect(mockValidateToken).toHaveBeenCalledWith('bearer_token');
        expect(next).toHaveBeenCalled();
    });

    it('rechaza con 403 si el usuario Bearer está suspendido', async () => {
        const res = mockRes();
        const req = mockReq({ headers: { authorization: 'Bearer suspended_token' } });

        mockValidateToken.mockResolvedValue({ user_id: 'u4', login: 'strm4' });
        mockGetUser.mockResolvedValue({ userId: 'u4', login: 'strm4', isActive: false });

        await checkToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
