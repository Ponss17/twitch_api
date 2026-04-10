jest.mock('@vercel/kv', () => ({ kv: { get: jest.fn().mockResolvedValue(null), set: jest.fn() } }));
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
} from '../../src/features/twitch/twitch.service';
import { TwitchApiError } from '../../src/core/errors/AppError';

const resetCB = () => {
    CIRCUIT_BREAKER.failures = 0;
    CIRCUIT_BREAKER.lastFailure = 0;
    CIRCUIT_BREAKER.state = 'CLOSED';
};

describe('Circuit Breaker — lógica de estado', () => {
    beforeEach(resetCB);

    it('circuito CLOSED: checkCircuit no lanza', () => {
        expect(() => checkCircuit()).not.toThrow();
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

    it('circuito OPEN: checkCircuit lanza TwitchApiError 503', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        expect(() => checkCircuit()).toThrow(TwitchApiError);
        expect(() => checkCircuit()).toThrow(expect.objectContaining({ statusCode: 503 }));
    });

    it('pasa a HALF_OPEN tras el cooldown', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        CIRCUIT_BREAKER.lastFailure = Date.now() - 31_000;
        expect(() => checkCircuit()).not.toThrow();
        expect(CIRCUIT_BREAKER.state).toBe('HALF_OPEN');
    });

    it('circuito HALF_OPEN: checkCircuit no lanza, permite un intento', () => {
        CIRCUIT_BREAKER.state = 'HALF_OPEN';
        expect(() => checkCircuit()).not.toThrow();
    });

    it('recordSuccess cierra el circuito y resetea fallos', () => {
        for (let i = 0; i < 5; i++) recordFailure();
        expect(CIRCUIT_BREAKER.state).toBe('OPEN');
        recordSuccess();
        expect(CIRCUIT_BREAKER.state).toBe('CLOSED');
        expect(CIRCUIT_BREAKER.failures).toBe(0);
    });
});
