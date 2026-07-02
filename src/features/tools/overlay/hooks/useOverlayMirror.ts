import { useCallback, useEffect, useRef, useState } from 'react';
import { type Session } from '@/core/config/config';
import { overlayAuthHeaders, overlayStatePollUrl } from '@/features/tools/overlay/lib/auth';
import { getOverlayStoredSession, getOverlayTokenFromPage } from '@/features/tools/overlay/lib/overlaySession';
import { debugWarn } from '@/core/logging/debugLog';
import type {
    OverlayTool,
    RouletteOverlayState,
    TrendsOverlayState
} from '@/features/tools/overlay/lib/types';
import {
    emptyRouletteOverlayState,
    emptyTrendsOverlayState
} from '@/features/tools/overlay/lib/types';
import { overlayStateFingerprint } from '@/features/tools/overlay/lib/overlayStateUtils';

const POLL_TRENDS_MS = 1000;
const POLL_ROULETTE_MS = 450;
const POLL_SPINNING_MS = 200;
const POLL_STANDBY_MS = 3000;
const STALE_MS = 8000;

function resolvePollSession(session: Session | null): Session | null {
    const pageToken = getOverlayTokenFromPage();
    if (pageToken) {
        return { ...(session ?? {}), overlayToken: pageToken };
    }
    if (!session) return null;
    if (session.overlayToken || session.apiKey || session.token) return session;
    const stored = getOverlayStoredSession();
    if (stored?.overlayToken || stored?.apiKey || stored?.token) {
        return { ...session, ...stored };
    }
    return session;
}

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
    const emptyStateRef = useRef(emptyState);
    emptyStateRef.current = emptyState;
    const [connected, setConnected] = useState(false);
    const [stale, setStale] = useState(true);
    const lastUpdatedRef = useRef(0);
    const lastSpinSeqRef = useRef(0);
    const lastReceivedFingerprintRef = useRef('');
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
        const pollSession = resolvePollSession(session);
        if (!pollSession?.overlayToken && !pollSession?.apiKey && !pollSession?.token) return;

        try {
            const res = await fetch(overlayStatePollUrl(tool, pollSession), {
                headers: overlayAuthHeaders(pollSession),
                cache: 'no-store'
            });
            if (!res.ok) {
                debugWarn(`[overlay] poll ${tool} HTTP ${res.status}`);
                setConnected(false);
                setStale(true);
                return;
            }

            const data = (await res.json()) as { state: State | null };
            setConnected(true);

            if (!data.state) {
                setState(emptyStateRef.current);
                lastReceivedFingerprintRef.current = '';
                setStale(true);
                return;
            }

            lastUpdatedRef.current = data.state.updatedAt ?? Date.now();
            setStale(Date.now() - lastUpdatedRef.current > STALE_MS);

            const fingerprint = overlayStateFingerprint(tool, data.state);
            if (fingerprint === lastReceivedFingerprintRef.current) return;
            lastReceivedFingerprintRef.current = fingerprint;

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

    const trendsState = tool === 'trends' ? (state as TrendsOverlayState) : null;
    const trendsStandby =
        !!trendsState && !trendsState.tracking && !trendsState.sessionActive;

    const rouletteState = tool === 'roulette' ? (state as RouletteOverlayState) : null;
    const rouletteNeedsFastPoll =
        !!rouletteState &&
        (rouletteState.isSpinning ||
            rouletteState.isOpen ||
            rouletteState.winner !== null);

    const pollIntervalMs =
        tool === 'trends'
            ? trendsStandby
                ? POLL_STANDBY_MS
                : POLL_TRENDS_MS
            : isRouletteSpinning
              ? POLL_SPINNING_MS
              : rouletteNeedsFastPoll
                ? POLL_ROULETTE_MS
                : POLL_STANDBY_MS;

    useEffect(() => {
        if (!session?.overlayToken && !session?.apiKey && !session?.token) return;

        void poll();
        const id = window.setInterval(() => void poll(), pollIntervalMs);
        return () => clearInterval(id);
    }, [session, poll, pollIntervalMs]);

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
