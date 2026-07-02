import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { overlayAuthHeaders } from '@/features/tools/overlay/lib/auth';
import type {
    OverlayTool,
    RouletteOverlayState,
    TrendsOverlayState
} from '@/features/tools/overlay/lib/types';
import {
    emptyRouletteOverlayState,
    emptyTrendsOverlayState
} from '@/features/tools/overlay/lib/types';

const POLL_INTERVAL_MS = 450;
const POLL_SPINNING_MS = 200;
const STALE_MS = 5000;

export function useOverlayMirror<T extends OverlayTool>(
    tool: T,
    session: Session | null
): {
    state: T extends 'roulette' ? RouletteOverlayState : TrendsOverlayState;
    connected: boolean;
    stale: boolean;
} {
    type State = T extends 'roulette' ? RouletteOverlayState : TrendsOverlayState;

    const emptyState = (
        tool === 'roulette'
            ? emptyRouletteOverlayState()
            : emptyTrendsOverlayState(session?.displayName ?? session?.login ?? 'Canal')
    ) as State;

    const [state, setState] = useState<State>(emptyState);
    const [connected, setConnected] = useState(false);
    const [stale, setStale] = useState(true);
    const lastUpdatedRef = useRef(0);
    const lastSpinSeqRef = useRef(0);
    const wheelRotationRef = useRef(0);

    const applyRouletteSpin = useCallback((next: RouletteOverlayState) => {
        if (next.spinSeq <= lastSpinSeqRef.current) return next;

        lastSpinSeqRef.current = next.spinSeq;

        if (
            next.isSpinning &&
            next.targetRotation !== undefined &&
            next.spinDuration !== undefined
        ) {
            const prefersReducedMotion =
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion) {
                wheelRotationRef.current = next.targetRotation;
                return {
                    ...next,
                    wheelRotation: next.targetRotation,
                    wheelTransition: 'none'
                };
            }

            const transition = `transform ${Math.round(next.spinDuration)}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
            requestAnimationFrame(() => {
                setState((prev) => {
                    const p = prev as unknown as RouletteOverlayState;
                    return {
                        ...p,
                        wheelTransition: transition,
                        wheelRotation: next.targetRotation!
                    } as State;
                });
            });

            wheelRotationRef.current = next.targetRotation;
            return {
                ...next,
                wheelTransition: 'none',
                wheelRotation: wheelRotationRef.current
            };
        }

        wheelRotationRef.current = next.wheelRotation;
        return next;
    }, []);

    const poll = useCallback(async () => {
        if (!session?.apiKey && !session?.token) return;

        try {
            const res = await fetch(`${API_ENDPOINTS.BASE}/dashboard/overlay-state/${tool}`, {
                headers: overlayAuthHeaders(session)
            });
            if (!res.ok) {
                setConnected(false);
                setStale(true);
                return;
            }

            const data = (await res.json()) as { state: State | null };
            setConnected(true);

            if (!data.state) {
                setStale(true);
                return;
            }

            lastUpdatedRef.current = data.state.updatedAt ?? Date.now();
            setStale(Date.now() - lastUpdatedRef.current > STALE_MS);

            if (tool === 'roulette') {
                const rouletteState = applyRouletteSpin(data.state as RouletteOverlayState);
                setState(rouletteState as State);
            } else {
                setState(data.state);
            }
        } catch {
            setConnected(false);
            setStale(true);
        }
    }, [session, tool, applyRouletteSpin]);

    const isRouletteSpinning =
        tool === 'roulette' ? (state as RouletteOverlayState).isSpinning : false;

    useEffect(() => {
        if (!session?.apiKey && !session?.token) return;

        void poll();
        const intervalMs = isRouletteSpinning ? POLL_SPINNING_MS : POLL_INTERVAL_MS;

        const id = window.setInterval(() => void poll(), intervalMs);
        return () => clearInterval(id);
    }, [session, poll, isRouletteSpinning]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (!lastUpdatedRef.current) {
                setStale(true);
                return;
            }
            setStale(Date.now() - lastUpdatedRef.current > STALE_MS);
        }, 1000);
        return () => clearInterval(id);
    }, []);

    return { state, connected, stale };
}
