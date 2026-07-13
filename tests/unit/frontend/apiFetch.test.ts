jest.mock('@/core/auth/sessionLifecycle', () => ({
    invalidateSession: jest.fn()
}));

jest.mock('@/core/auth/sessionStorage', () => ({
    getSession: jest.fn(() => ({ userId: 'u1', login: 'tester' }))
}));

jest.mock('@/core/auth/authHeaders', () => ({
    authHeaders: jest.fn(() => ({}))
}));

jest.mock('@/core/auth/apiCredentials', () => ({
    withApiCredentials: (init: RequestInit) => init
}));

import { invalidateSession } from '@/core/auth/sessionLifecycle';
import {
    __resetSessionAuthGraceForTests,
    markSessionValidated
} from '@/core/auth/sessionAuthGrace';
import { apiFetch } from '@/core/auth/apiFetch';

const session = { userId: 'u1', login: 'tester' };

describe('apiFetch 401 handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        __resetSessionAuthGraceForTests();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('no cierra sesión por 401 durante la gracia post-validate', async () => {
        markSessionValidated();

        const fetchMock = jest
            .fn()
            .mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' });

        global.fetch = fetchMock as typeof fetch;

        const promise = apiFetch('/api/test', session).catch((e: Error) => e);

        await jest.runAllTimersAsync();

        const result = await promise;
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe('unauthorized');
        expect(invalidateSession).not.toHaveBeenCalled();
    });

    it('cierra sesión por 401 persistente fuera de la gracia', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' });

        global.fetch = fetchMock as typeof fetch;

        void apiFetch('/api/test', session);

        await jest.runAllTimersAsync();

        expect(invalidateSession).toHaveBeenCalledWith({ broadcast: true });
    });

    it('respeta logoutOn401: false aunque no haya gracia', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' });

        global.fetch = fetchMock as typeof fetch;

        const promise = apiFetch('/api/test', session, {}, { logoutOn401: false }).catch(
            (e: Error) => e
        );

        await jest.runAllTimersAsync();

        const result = await promise;
        expect(result).toBeInstanceOf(Error);
        expect(invalidateSession).not.toHaveBeenCalled();
    });

    it('recupera tras 401 transitorio en gracia', async () => {
        markSessionValidated();

        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'unauthorized' })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ ok: true })
            });

        global.fetch = fetchMock as typeof fetch;

        const promise = apiFetch<{ ok: boolean }>('/api/test', session);

        await jest.runAllTimersAsync();

        await expect(promise).resolves.toEqual({ ok: true });
        expect(invalidateSession).not.toHaveBeenCalled();
    });
});
