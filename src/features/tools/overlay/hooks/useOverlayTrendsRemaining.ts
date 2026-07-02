import { useEffect, useState } from 'react';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';
import { overlayTrendsRemaining } from '@/features/tools/overlay/lib/overlayStateUtils';

function snapshot(
    tracking: boolean,
    timerEnded: boolean,
    remaining: number,
    updatedAt: number
): TrendsOverlayState {
    return {
        tracking,
        timerEnded,
        remaining,
        updatedAt,
        wordCounts: {},
        minutes: 0,
        displayName: '',
        sessionActive: false
    };
}

/** Cuenta atrás local en OBS — deriva de `remaining` + `updatedAt` del último sync. */
export function useOverlayTrendsRemaining(state: TrendsOverlayState): number {
    const { tracking, timerEnded, remaining, updatedAt } = state;

    const [displayRemaining, setDisplayRemaining] = useState(() =>
        overlayTrendsRemaining(snapshot(tracking, timerEnded, remaining, updatedAt))
    );

    useEffect(() => {
        const tick = () =>
            setDisplayRemaining(
                overlayTrendsRemaining(snapshot(tracking, timerEnded, remaining, updatedAt))
            );

        tick();
        if (!tracking || timerEnded) return;

        const id = window.setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [tracking, timerEnded, remaining, updatedAt]);

    return displayRemaining;
}
