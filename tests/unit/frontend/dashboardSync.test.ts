import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import {
    broadcastHomeDataReset,
    subscribeHomeDataReset
} from '@/features/dashboard/lib/dashboardSync';

describe('dashboardSync home data reset', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('notifies subscribers in the same tab', () => {
        const handler = jest.fn();
        const cleanup = subscribeHomeDataReset('user-1', handler);

        broadcastHomeDataReset('user-1');
        expect(handler).toHaveBeenCalledTimes(1);

        broadcastHomeDataReset('user-2');
        expect(handler).toHaveBeenCalledTimes(1);

        cleanup();
    });
});
