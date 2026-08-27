const mockRecordUserRequest = jest.fn().mockResolvedValue(undefined);
const mockAddUserActivity = jest.fn().mockResolvedValue(undefined);

jest.mock('../../backend/src/core/database/dbService', () => ({
    recordUserRequest: (...args: unknown[]) => mockRecordUserRequest(...args),
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
            null,   // incrementStat — null cuando no se especifica
            undefined, // skipRequestCount
            undefined  // userTimezone
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
            expect.objectContaining({
                type: 'stalker',
                metadata: expect.objectContaining({ latencyMs: expect.any(Number) })
            })
        );
    });

    it('guarda lang y response desde el request en metadata', async () => {
        const req = {
            method: 'GET',
            query: { lang: 'en', channel: 'mynana17' },
            body: {}
        } as unknown as import('express').Request;

        await trackRequest(
            'user1',
            { type: 'followage', user: 'viewer', metadata: { target: 'mynana17' } },
            async () => 'viewer has followed mynana17 for 2 years',
            req
        );
        expect(mockAddUserActivity).toHaveBeenCalledWith(
            'user1',
            expect.objectContaining({
                metadata: expect.objectContaining({
                    target: 'mynana17',
                    lang: 'en',
                    response: 'viewer has followed mynana17 for 2 years',
                    latencyMs: expect.any(Number)
                })
            })
        );
        const meta = mockAddUserActivity.mock.calls[0]?.[1]?.metadata as Record<string, unknown>;
        expect(meta.channel).toBeUndefined();
    });

    it('redacta apiKey en response al guardar actividad', async () => {
        const { summarizeActivityResponse } = await import('../../backend/src/core/utils/tracking');
        expect(summarizeActivityResponse('https://x.test/?apiKey=secreto')).toContain('**************');
        expect(summarizeActivityResponse('https://x.test/?apiKey=secreto')).not.toContain('secreto');
    });

    it('NO llama a addUserActivity cuando skipActivityLog es true', async () => {
        await trackRequest(
            'user1',
            { type: 'other', user: 'bot', skipActivityLog: true },
            async () => null
        );
        expect(mockAddUserActivity).not.toHaveBeenCalled();
    });

    it('pasa incrementStat a recordUserRequest cuando se especifica', async () => {
        await trackRequest(
            'user1',
            { type: 'clip', user: 'test', incrementStat: 'clips' },
            async () => null
        );
        expect(mockRecordUserRequest).toHaveBeenCalledWith(
            'user1',
            expect.any(Number),
            true,
            'clips',  // incrementStat se pasa como 4º argumento
            undefined, // skipRequestCount
            undefined  // userTimezone
        );
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
            null,   // incrementStat — null cuando no se especifica
            undefined, // skipRequestCount
            undefined  // userTimezone
        );
    });

    it('sin userId no hace ninguna llamada a DB', async () => {
        await trackRequest(undefined, { type: 'clip', user: 'guest' }, async () => 'result');
        expect(mockRecordUserRequest).not.toHaveBeenCalled();
        expect(mockAddUserActivity).not.toHaveBeenCalled();
    });
});
