const mockKvGet = jest.fn().mockResolvedValue(null);
const mockKvSet = jest.fn().mockResolvedValue('OK');
const mockKvDel = jest.fn().mockResolvedValue(1);

jest.mock('@/core/database/redisClient', () => ({
    kv: { get: mockKvGet, set: mockKvSet, del: mockKvDel }
}));
jest.mock('@/core/database/cacheService', () => ({
    getCachedUserId: jest.fn().mockResolvedValue(null),
    setCachedUserId: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('@/core/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));
jest.mock('@/core/utils/time', () => ({
    getTimePhraseBetween: jest.fn().mockReturnValue('1 año')
}));

import {
    CIRCUIT_BREAKER,
    checkCircuit,
    recordFailure,
    recordSuccess
} from '../../backend/src/features/twitch/twitch.service';
import { TwitchApiError } from '../../backend/src/core/errors/AppError';

const resetCB = () => {
    CIRCUIT_BREAKER.failures = 0;
    CIRCUIT_BREAKER.lastFailure = 0;
    CIRCUIT_BREAKER.state = 'CLOSED';
    CIRCUIT_BREAKER._synced = false;
};

describe('Circuit Breaker — lógica de estado', () => {
    beforeEach(() => {
        resetCB();
        jest.clearAllMocks();
    });

    it('circuito CLOSED: checkCircuit no lanza', async () => {
        await expect(checkCircuit()).resolves.not.toThrow();
    });

    it('recordFailure incrementa el contador', () => {
        recordFailure();
        expect(CIRCUIT_BREAKER.failures).toBe(1);
        expect(CIRCUIT_BREAKER.state).toBe('CLOSED');
    });

    it('abre el circuito al alcanzar el umbral (5 fallos)', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        expect(CIRCUIT_BREAKER.state).toBe('OPEN');
    });

    it('persiste estado OPEN en KV al abrir el circuito', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        expect(mockKvSet).toHaveBeenCalledWith(
            'twitch_api:circuit_breaker:twitch',
            expect.objectContaining({ state: 'OPEN', lastFailure: expect.any(Number) }),
            { ex: 120 }
        );
    });

    it('circuito OPEN: checkCircuit lanza TwitchApiError 503', async () => {
        for (let i = 0; i < 5; i++) recordFailure();
        await expect(checkCircuit()).rejects.toThrow(TwitchApiError);
        await expect(checkCircuit()).rejects.toMatchObject({ statusCode: 503 });
    });

    it('pasa a HALF_OPEN tras el cooldown', async () => {
        for (let i = 0; i < 5; i++) recordFailure();
        CIRCUIT_BREAKER.lastFailure = Date.now() - 31_000;
        await expect(checkCircuit()).resolves.not.toThrow();
        expect(CIRCUIT_BREAKER.state).toBe('HALF_OPEN');
    });

    it('circuito HALF_OPEN: checkCircuit no lanza, permite un intento', async () => {
        CIRCUIT_BREAKER.state = 'HALF_OPEN';
        await expect(checkCircuit()).resolves.not.toThrow();
    });

    it('recordSuccess cierra el circuito y limpia KV', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        expect(CIRCUIT_BREAKER.state).toBe('OPEN');
        recordSuccess();
        expect(CIRCUIT_BREAKER.state).toBe('CLOSED');
        expect(CIRCUIT_BREAKER.failures).toBe(0);
        expect(mockKvDel).toHaveBeenCalledWith('twitch_api:circuit_breaker:twitch');
    });
});
