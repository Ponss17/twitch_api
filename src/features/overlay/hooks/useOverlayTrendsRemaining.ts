import { useEffect, useState } from 'react';
import type { TrendsOverlayState } from '@/features/overlay/lib/types';
import { overlayTrendsRemaining } from '@/features/overlay/lib/overlayStateUtils';

/** Cuenta atrás local en OBS — usa `timerEndsAt` o deriva de `remaining` + `updatedAt`. */
export function useOverlayTrendsRemaining(state: TrendsOverlayState): number {
    const { tracking, timerEnded, remaining, updatedAt, timerEndsAt } = state;

    const [displayRemaining, setDisplayRemaining] = useState(() =>
        overlayTrendsRemaining(state)
    );

    useEffect(() => {
        const tick = () =>
            setDisplayRemaining(
                overlayTrendsRemaining({
                    tracking,
                    timerEnded,
                    remaining,
                    updatedAt,
                    timerEndsAt,
                    wordCounts: {},
                    minutes: 0,
                    displayName: '',
                    sessionActive: false
                })
            );

        tick();
        if (!tracking || timerEnded) return;

        const id = window.setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [tracking, timerEnded, remaining, updatedAt, timerEndsAt]);

    return displayRemaining;
}
