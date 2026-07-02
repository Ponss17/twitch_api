import { reportSessionLoadProgress, SESSION_LOAD_EVENT } from '@/core/session/loadProgress';

describe('sessionLoadProgress', () => {
    it('dispatches progress events on window', () => {
        const handler = jest.fn();
        window.addEventListener(SESSION_LOAD_EVENT, handler);

        reportSessionLoadProgress({
            progress: 42,
            label: 'Test',
            cached: true
        });

        expect(handler).toHaveBeenCalledTimes(1);
        const event = handler.mock.calls[0][0] as CustomEvent;
        expect(event.detail).toEqual({
            progress: 42,
            label: 'Test',
            cached: true
        });

        window.removeEventListener(SESSION_LOAD_EVENT, handler);
    });
});
