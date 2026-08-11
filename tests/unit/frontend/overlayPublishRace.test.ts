jest.mock('@/core/api/auth', () => ({
    authHeaders: () => ({}),
    withApiCredentials: (init: RequestInit) => init
}));
jest.mock('@/core/config/config', () => ({
    API_ENDPOINTS: { OVERLAY_STATE: '/overlay/state/' }
}));

import { publishOverlayState, resetOverlayPublishCache } from '@/features/overlay/lib/sync';
import type { TrendsOverlayState } from '@/features/overlay/lib/types';

function deferredResponse() {
    let resolve!: (response: Response) => void;
    const promise = new Promise<Response>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

const session = { userId: 'u1', login: 'tester' };

function state(remaining: number): TrendsOverlayState {
    return {
        tracking: true,
        remaining,
        timerEnded: false,
        wordCounts: {},
        minutes: 5,
        displayName: 'Tester',
        sessionActive: true,
        updatedAt: Date.now()
    };
}

describe('publishOverlayState ordering', () => {
    beforeEach(() => resetOverlayPublishCache());

    it('serializa publicaciones de una herramienta para que gane la más reciente', async () => {
        const first = deferredResponse();
        const fetchMock = jest.fn().mockReturnValueOnce(first.promise);
        global.fetch = fetchMock as typeof fetch;

        const oldPublish = publishOverlayState('trends', state(30), session);
        const newPublish = publishOverlayState('trends', state(10), session);

        // Drain coalesces with an await Promise.resolve(); flush enough microtasks.
        for (let i = 0; i < 5; i++) await Promise.resolve();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string).state.remaining).toBe(10);

        first.resolve({ ok: true } as Response);
        await Promise.all([oldPublish, newPublish]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
