jest.mock('@/core/api/auth', () => ({
    clearValidateCache: jest.fn()
}));

import { act, renderHook } from '@testing-library/react';
import { clearValidateCache } from '@/core/api/auth';
import { useProactiveTokenRefresh } from '@/core/session/useProactiveTokenRefresh';

const MINUTE = 60_000;

describe('useProactiveTokenRefresh races', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('usa la sesión actual aunque no cambien las dependencias del efecto', async () => {
        const expiresAt = Date.now() + 36 * MINUTE;
        const refresh = jest.fn().mockResolvedValue(undefined);
        const { rerender } = renderHook(
            ({ displayName }) => {
                useProactiveTokenRefresh(
                    { userId: 'u1', login: 'tester', displayName, tokenExpiresAt: expiresAt },
                    refresh,
                    true
                );
            },
            { initialProps: { displayName: 'Old' } }
        );

        rerender({ displayName: 'Current' });
        await act(async () => {
            await jest.advanceTimersByTimeAsync(MINUTE);
        });

        expect(clearValidateCache).toHaveBeenCalledWith(
            expect.objectContaining({ displayName: 'Current' })
        );
    });

    it('no reprograma una ejecución resuelta después de quedar obsoleta', async () => {
        let resolveRefresh!: () => void;
        const refresh = jest.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveRefresh = resolve;
                })
        );
        const expiresAt = Date.now() + 36 * MINUTE;
        const { rerender } = renderHook(
            ({ userId }) =>
                useProactiveTokenRefresh(
                    { userId, login: userId, tokenExpiresAt: expiresAt },
                    refresh,
                    true
                ),
            { initialProps: { userId: 'u1' } }
        );

        await act(async () => {
            await jest.advanceTimersByTimeAsync(MINUTE);
        });
        expect(refresh).toHaveBeenCalledTimes(1);

        rerender({ userId: 'u2' });
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        const callsBefore = setTimeoutSpy.mock.calls.length;

        await act(async () => {
            resolveRefresh();
            await Promise.resolve();
            await Promise.resolve();
        });

        // Solo el efecto activo puede reprogramar; la resolución obsoleta no debe crear timers.
        const refreshTimers = setTimeoutSpy.mock.calls
            .slice(callsBefore)
            .filter((call) => typeof call[1] === 'number' && (call[1] as number) >= MINUTE);
        expect(refreshTimers).toHaveLength(0);
        setTimeoutSpy.mockRestore();
    });
});
