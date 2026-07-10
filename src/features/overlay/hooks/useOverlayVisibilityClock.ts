import { useEffect, useRef, useState } from 'react';
import type { RouletteOverlayState, TrendsOverlayState } from '@/features/overlay/lib/types';
import {
    ROULETTE_OVERLAY_WINNER_MS,
    shouldShowRouletteOverlay,
    shouldShowTrendsOverlay,
    TRENDS_OVERLAY_RESULTS_MS
} from '@/features/overlay/lib/overlayStateUtils';

function useVisibilityClock(active: boolean) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!active) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [active]);

    return now;
}

/** Ancla local del ganador — no depende de updatedAt del servidor (se refresca en cada PUT). */
export function useRouletteOverlayVisible(state: RouletteOverlayState): boolean {
    const winnerShownAtRef = useRef<number | null>(null);
    const lastSpinSeqRef = useRef(-1);

    if (!state.winner) {
        winnerShownAtRef.current = null;
        lastSpinSeqRef.current = -1;
    } else if (state.spinSeq !== lastSpinSeqRef.current) {
        lastSpinSeqRef.current = state.spinSeq;
        winnerShownAtRef.current = Date.now();
    }

    const winnerShownAt = winnerShownAtRef.current;
    const ticking =
        state.isSpinning ||
        (state.winner !== null &&
            winnerShownAt !== null &&
            Date.now() - winnerShownAt < ROULETTE_OVERLAY_WINNER_MS);
    const now = useVisibilityClock(ticking);

    return shouldShowRouletteOverlay(state, now, winnerShownAt);
}

/** Ancla local del fin del timer — evita que re-publicaciones del panel reinicien el contador. */
export function useTrendsOverlayVisible(state: TrendsOverlayState): boolean {
    const endedAtRef = useRef<number | null>(null);
    const wasTrackingRef = useRef(false);

    if (state.tracking) {
        endedAtRef.current = null;
        wasTrackingRef.current = true;
    } else if (wasTrackingRef.current && state.timerEnded && state.sessionActive) {
        if (endedAtRef.current === null) {
            endedAtRef.current = Date.now();
        }
        wasTrackingRef.current = false;
    } else if (!state.sessionActive || !state.timerEnded) {
        endedAtRef.current = null;
        wasTrackingRef.current = false;
    }

    const endedAt = endedAtRef.current;
    const ticking =
        state.tracking ||
        (state.timerEnded &&
            state.sessionActive &&
            endedAt !== null &&
            Date.now() - endedAt < TRENDS_OVERLAY_RESULTS_MS);
    const now = useVisibilityClock(ticking);

    return shouldShowTrendsOverlay(state, now, endedAt);
}
