import { useCallback, useEffect, useRef, useState } from 'react';
import { type Session } from '@/core/config/config';
import {
    hasOverlayPollCredentials,
    overlaySessionKey
} from '@/features/tools/overlay/lib/credentials';
import { overlayAuthHeaders, overlayStatePollUrl } from '@/features/tools/overlay/lib/overlayApi';
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
import {
    OVERLAY_POLL_IDLE_MS,
    overlayStateFingerprint,
    resolveOverlayPollIntervalMs,
    updateOverlayPollAnchors,
    type OverlayPollAnchors
} from '@/features/tools/overlay/lib/overlayStateUtils';

/** Umbral mínimo de "stale"; con poll idle (60s) se usa 1.5× el intervalo. */
const STALE_MS_MIN = 8000;

function isAbortError(err: unknown): boolean {
    return (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
    );
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
    const [pollIntervalMs, setPollIntervalMs] = useState<number | null>(null);
    const lastPollAtRef = useRef(0);
    const lastSpinSeqRef = useRef(0);
    const lastReceivedFingerprintRef = useRef('');
    const wheelRotationRef = useRef(0);
    const pollIntervalMsRef = useRef(pollIntervalMs);
    pollIntervalMsRef.current = pollIntervalMs;
    const pollAnchorsRef = useRef<OverlayPollAnchors>({
        winnerShownAt: null,
        trendsEndedAt: null,
        lastSpinSeq: -1,
        wasTracking: false
    });
    const mirroredStateRef = useRef<State | null>(null);
    const sessionKey = overlaySessionKey(session);

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

    const syncPollInterval = useCallback(
        (nextState: State | null) => {
            mirroredStateRef.current = nextState;
            updateOverlayPollAnchors(tool, nextState, pollAnchorsRef.current);
            const nextInterval = resolveOverlayPollIntervalMs(
                tool,
                nextState,
                Date.now(),
                pollAnchorsRef.current
            );
            setPollIntervalMs((prev) => (prev === nextInterval ? prev : nextInterval));
        },
        [tool]
    );

    const poll = useCallback(
        async (signal?: AbortSignal) => {
            if (!hasOverlayPollCredentials(session)) return;

            try {
                const res = await fetch(overlayStatePollUrl(tool, session), {
                    headers: overlayAuthHeaders(session),
                    cache: 'no-store',
                    signal
                });
                if (signal?.aborted) return;
                if (!res.ok) {
                    debugWarn(`[overlay] poll ${tool} HTTP ${res.status}`);
                    setConnected(false);
                    setStale(true);
                    syncPollInterval(null);
                    return;
                }

                const data = (await res.json()) as { state: State | null };
                if (signal?.aborted) return;

                setConnected(true);
                lastPollAtRef.current = Date.now();
                setStale(false);

                if (!data.state) {
                    pollAnchorsRef.current = {
                        winnerShownAt: null,
                        trendsEndedAt: null,
                        lastSpinSeq: -1,
                        wasTracking: false
                    };
                    setState(emptyStateRef.current);
                    lastReceivedFingerprintRef.current = '';
                    setStale(true);
                    syncPollInterval(null);
                    return;
                }

                const fingerprint = overlayStateFingerprint(tool, data.state);
                if (fingerprint === lastReceivedFingerprintRef.current) {
                    syncPollInterval(data.state);
                    return;
                }
                lastReceivedFingerprintRef.current = fingerprint;

                let nextState = data.state;
                if (tool === 'roulette') {
                    nextState = applyRouletteSpin(data.state as RouletteOverlayState) as State;
                }
                setState(nextState);
                syncPollInterval(nextState);
            } catch (err) {
                if (signal?.aborted || isAbortError(err)) return;
                setConnected(false);
                setStale(true);
                syncPollInterval(mirroredStateRef.current);
            }
        },
        [session, tool, applyRouletteSpin, syncPollInterval]
    );

    // Solo poll inmediato al cambiar credenciales/sesión — no al adaptar el intervalo.
    useEffect(() => {
        if (!hasOverlayPollCredentials(session)) return;

        const ac = new AbortController();
        void poll(ac.signal);
        return () => ac.abort();
    }, [sessionKey, poll, session]);

    // Intervalo adaptativo: reinicia el timer sin GET extra.
    useEffect(() => {
        if (!hasOverlayPollCredentials(session)) return;
        if (pollIntervalMs === null) return;

        let tickAc: AbortController | null = null;
        const id = window.setInterval(() => {
            tickAc?.abort();
            tickAc = new AbortController();
            void poll(tickAc.signal);
        }, pollIntervalMs);

        return () => {
            clearInterval(id);
            tickAc?.abort();
        };
    }, [sessionKey, poll, pollIntervalMs, session]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (!lastPollAtRef.current) {
                setStale(true);
                return;
            }
            const interval = pollIntervalMsRef.current ?? OVERLAY_POLL_IDLE_MS;
            const threshold = Math.max(STALE_MS_MIN, Math.floor(interval * 1.5));
            setStale(Date.now() - lastPollAtRef.current > threshold);
        }, 1000);
        return () => clearInterval(id);
    }, []);

    return { state, connected, stale };
}
