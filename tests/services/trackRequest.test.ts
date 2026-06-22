const mockRecordUserRequest = jest.fn().mockResolvedValue(undefined);
const mockIncrementUserStats = jest.fn().mockResolvedValue(undefined);
const mockAddUserActivity = jest.fn().mockResolvedValue(undefined);

jest.mock('../../backend/src/core/database/dbService', () => ({
    recordUserRequest: (...args: unknown[]) => mockRecordUserRequest(...args),
    incrementUserStats: (...args: unknown[]) => mockIncrementUserStats(...args),
    addUserActivity: (...args: unknown[]) => mockAddUserActivity(...args)
}));

jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

import { trackRequest } from '../../backend/src/core/utils/tracking';

describe('trackRequest', () => {
    beforeEach(() => jest.clearAllMocks());

    it('ejecuta la acción y retorna su resultado', async () => {
        const result = await trackRequest('user1', { type: 'clip', user: 'test' }, async () => 42);
        expect(result).toBe(42);
    });

    it('llama a recordUserRequest con éxito=true cuando la acción pasa', async () => {
        await trackRequest('user1', { type: 'clip', user: 'test' }, async () => 'ok');
        expect(mockRecordUserRequest).toHaveBeenCalledWith(
            'user1',
            expect.any(Number),
            true,
            undefined
        );
    });

    it('llama a addUserActivity cuando skipActivityLog es false', async () => {
        await trackRequest(
            'user1',
            { type: 'stalker', user: 'test', skipActivityLog: false },
            async () => null
        );
        expect(mockAddUserActivity).toHaveBeenCalledWith(
            'user1',
            expect.objectContaining({ type: 'stalker' })
        );
    });

    it('NO llama a addUserActivity cuando skipActivityLog es true', async () => {
        await trackRequest(
            'user1',
            { type: 'other', user: 'bot', skipActivityLog: true },
            async () => null
        );
        expect(mockAddUserActivity).not.toHaveBeenCalled();
    });

    it('llama a incrementUserStats cuando se pasa incrementStat', async () => {
        await trackRequest(
            'user1',
            { type: 'clip', user: 'test', incrementStat: 'clips' },
            async () => null
        );
        expect(mockIncrementUserStats).toHaveBeenCalledWith('user1', 'clips');
    });

    it('registra fallo con éxito=false cuando la acción lanza error', async () => {
        await expect(
            trackRequest('user1', { type: 'other', user: 'test' }, async () => {
                throw new Error('fallo de prueba');
            })
        ).rejects.toThrow('fallo de prueba');

        expect(mockRecordUserRequest).toHaveBeenCalledWith(
            'user1',
            expect.any(Number),
            false,
            undefined
        );
    });

    it('sin userId no hace ninguna llamada a DB', async () => {
        await trackRequest(undefined, { type: 'clip', user: 'guest' }, async () => 'result');
        expect(mockRecordUserRequest).not.toHaveBeenCalled();
        expect(mockAddUserActivity).not.toHaveBeenCalled();
    });
});
