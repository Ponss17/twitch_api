import { useCallback, useEffect, useRef } from 'react';
import type { Session } from '@/core/config/config';
import { publishOverlayState, resetOverlayPublishCache } from '@/features/overlay/lib/sync';
import type { OverlayTool, RouletteOverlayState, TrendsOverlayState } from '@/features/overlay/lib/types';

type OverlayStateForTool<T extends OverlayTool> = T extends 'roulette'
    ? RouletteOverlayState
    : TrendsOverlayState;

const PUBLISH_DEBOUNCE_MS = 500;

export interface UseOverlayPublishOptions<T extends OverlayTool> {
    tool: T;
    session: Session;
    active?: boolean;
    isCritical: (state: OverlayStateForTool<T>) => boolean;
    shouldSkip?: (state: OverlayStateForTool<T>) => boolean;
    resetCacheWhen?: (state: OverlayStateForTool<T>) => boolean;
}

export function useOverlayPublish<T extends OverlayTool>({
    tool,
    session,
    active = true,
    isCritical,
    shouldSkip,
    resetCacheWhen
}: UseOverlayPublishOptions<T>) {
    const publishTimerRef = useRef<number | null>(null);
    const sessionRef = useRef(session);
    sessionRef.current = session;

    const publish = useCallback(
        (state: OverlayStateForTool<T>) => {
            if (shouldSkip?.(state)) return;

            if (isCritical(state)) {
                if (publishTimerRef.current) {
                    clearTimeout(publishTimerRef.current);
                    publishTimerRef.current = null;
                }
                if (resetCacheWhen?.(state)) {
                    resetOverlayPublishCache(tool);
                }
                void publishOverlayState(tool, state, sessionRef.current);
                return;
            }

            if (!active) return;

            if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
            publishTimerRef.current = window.setTimeout(() => {
                void publishOverlayState(tool, state, sessionRef.current);
                publishTimerRef.current = null;
            }, PUBLISH_DEBOUNCE_MS);
        },
        [active, isCritical, resetCacheWhen, shouldSkip, tool]
    );

    useEffect(() => {
        return () => {
            if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
        };
    }, []);

    return publish;
}
