import { renderHook } from '@testing-library/react';
import { useMountedTabs } from '@/features/dashboard/hooks/useMountedTabs';

describe('useMountedTabs', () => {
    it('starts with the active tab mounted', () => {
        const { result } = renderHook(() => useMountedTabs('home'));
        expect(result.current.has('home')).toBe(true);
        expect(result.current.size).toBe(1);
    });

    it('keeps previously visited tabs in the set', () => {
        const { result, rerender } = renderHook(({ tab }: { tab: 'home' | 'clips' | 'profile' }) => useMountedTabs(tab), {
            initialProps: { tab: 'home' as const }
        });

        rerender({ tab: 'clips' });
        expect(result.current.has('home')).toBe(true);
        expect(result.current.has('clips')).toBe(true);

        rerender({ tab: 'profile' });
        expect(result.current.has('home')).toBe(true);
        expect(result.current.has('clips')).toBe(true);
        expect(result.current.has('profile')).toBe(true);
        expect(result.current.size).toBe(3);
    });
});
