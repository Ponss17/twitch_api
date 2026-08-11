import { fetchWithRetry } from '@/core/api/fetchWithRetry';

describe('fetchWithRetry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('no reintenta mutaciones inseguras por defecto', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ status: 503 });
        global.fetch = fetchMock as typeof fetch;

        await fetchWithRetry('/settings', { method: 'POST' });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reintenta métodos seguros', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({ status: 503 })
            .mockResolvedValueOnce({ status: 200 });
        global.fetch = fetchMock as typeof fetch;

        const request = fetchWithRetry('/profile', undefined, { retryDelayMs: 1 });
        await jest.runAllTimersAsync();

        await expect(request).resolves.toEqual({ status: 200 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('permite retry explícito o mediante Idempotency-Key', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({ status: 500 })
            .mockResolvedValueOnce({ status: 200 });
        global.fetch = fetchMock as typeof fetch;

        const request = fetchWithRetry(
            '/mutation',
            { method: 'PUT', headers: { 'Idempotency-Key': 'operation-1' } },
            { retryDelayMs: 1 }
        );
        await jest.runAllTimersAsync();

        await request;
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
