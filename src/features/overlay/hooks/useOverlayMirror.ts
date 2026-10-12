import { useCallback, useEffect, useRef, useState } from 'react';
import { type Session } from '@/core/config/config';
import {
    hasOverlayPollCredentials,
    overlaySessionKey
} from '@/features/overlay/lib/credentials';
import { overlayAuthHeaders, overlayStatePollUrl } from '@/features/overlay/lib/overlayApi';
import { debugWarn } from '@/core/logging/debugLog';
import { getSharedSupabaseClient } from '@/core/realtime/client';
import type {
    OverlayStateForTool,
    OverlayTool,
    RouletteOverlayState
} from '@/features/overlay/lib/types';
import { emptyOverlayState } from '@/features/overlay/lib/types';
import {
    OVERLAY_POLL_IDLE_MS,
    overlayStateFingerprint,
    resolveOverlayPollIntervalMs,
    updateOverlayPollAnchors,
    type OverlayPollAnchors
} from '@/features/overlay/lib/overlayStateUtils';

/** Umbral mínimo de "stale"; con poll idle (60s) se usa 1.5× el intervalo. */
const STALE_MS_MIN = 8000;
/** TTL de `overlay:state:*` en KV (2h) + margen: el broadcast no avisa cuando caduca. */
const OVERLAY_STATE_EXPIRY_CHECK_MS = 2 * 60 * 60_000 + 15_000;

interface OverlayRealtimeChannel {
    topic: string;
    event: string;
}

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
    state: OverlayStateForTool<T>;
    connected: boolean;
    stale: boolean;
    unauthorized: boolean;
    retrying: boolean;
    retry: () => void;
} {
    type State = OverlayStateForTool<T>;

    const emptyState = emptyOverlayState(
        tool,
        session?.displayName ?? session?.login ?? 'Channel'
    ) as State;

    const [state, setState] = useState<State>(emptyState);
    const emptyStateRef = useRef(emptyState);
    emptyStateRef.current = emptyState;
    const [connected, setConnected] = useState(false);
    const [stale, setStale] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [retrying, setRetrying] = useState(false);
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
    const [realtimeChannel, setRealtimeChannel] = useState<OverlayRealtimeChannel | null>(null);
    const [realtimeLive, setRealtimeLive] = useState(false);
    const realtimeLiveRef = useRef(false);
    realtimeLiveRef.current = realtimeLive;
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

    const applyIncomingState = useCallback(
        (incoming: State | null) => {
            setConnected(true);
            setUnauthorized(false);
            lastPollAtRef.current = Date.now();
            setStale(false);

            if (!incoming) {
                pollAnchorsRef.current = {
                    winnerShownAt: null,
                    trendsEndedAt: null,
                    lastSpinSeq: -1,
                    wasTracking: false
                };
                setState(emptyStateRef.current);
                lastReceivedFingerprintRef.current = '';
                // bits-roulette: sin estado en KV es idle normal (config va en la URL).
                setStale(tool !== 'bits-roulette' && !realtimeLiveRef.current);
                syncPollInterval(null);
                return;
            }

            const fingerprint = overlayStateFingerprint(tool, incoming);
            if (fingerprint === lastReceivedFingerprintRef.current) {
                syncPollInterval(incoming);
                return;
            }
            lastReceivedFingerprintRef.current = fingerprint;

            let nextState = incoming;
            if (tool === 'roulette') {
                nextState = applyRouletteSpin(incoming as RouletteOverlayState) as State;
            }
            setState(nextState);
            syncPollInterval(nextState);
        },
        [tool, applyRouletteSpin, syncPollInterval]
    );

    const poll = useCallback(
        async (signal?: AbortSignal, opts?: { manual?: boolean }) => {
            if (!hasOverlayPollCredentials(session)) return;

            if (opts?.manual) setRetrying(true);
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
                    setUnauthorized(res.status === 401 || res.status === 403);
                    syncPollInterval(null);
                    return;
                }

                const data = (await res.json()) as {
                    state: State | null;
                    realtime?: OverlayRealtimeChannel;
                };
                if (signal?.aborted) return;

                if (data.realtime?.topic) {
                    const next = data.realtime;
                    setRealtimeChannel((prev) =>
                        prev?.topic === next.topic && prev.event === next.event ? prev : next
                    );
                }
                applyIncomingState(data.state ?? null);
            } catch (err) {
                if (signal?.aborted || isAbortError(err)) return;
                setConnected(false);
                setStale(true);
                syncPollInterval(mirroredStateRef.current);
            } finally {
                if (opts?.manual) setRetrying(false);
            }
        },
        [session, tool, applyIncomingState, syncPollInterval]
    );
    const pollRef = useRef(poll);
    pollRef.current = poll;
    const applyIncomingStateRef = useRef(applyIncomingState);
    applyIncomingStateRef.current = applyIncomingState;

    const retry = useCallback(() => {
        void poll(undefined, { manual: true });
    }, [poll]);

    // Solo poll inmediato al cambiar credenciales/sesión — no al adaptar el intervalo.
    useEffect(() => {
        if (!hasOverlayPollCredentials(session)) return;

        const ac = new AbortController();
        void poll(ac.signal);
        return () => ac.abort();
    }, [sessionKey, poll, session]);

    useEffect(() => {
        if (!hasOverlayPollCredentials(session)) return;

        let resumeAc: AbortController | null = null;
        const resume = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            if (realtimeLiveRef.current) return;
            resumeAc?.abort();
            resumeAc = new AbortController();
            void poll(resumeAc.signal);
        };

        document.addEventListener('visibilitychange', resume);
        window.addEventListener('pageshow', resume);
        window.addEventListener('focus', resume);
        return () => {
            document.removeEventListener('visibilitychange', resume);
            window.removeEventListener('pageshow', resume);
            window.removeEventListener('focus', resume);
            resumeAc?.abort();
        };
    }, [sessionKey, poll, session]);

    useEffect(() => {
        if (!realtimeChannel) return;

        let cancelled = false;
        let syncAc: AbortController | null = null;
        let cleanup: (() => void) | null = null;

        void (async () => {
            const client = await getSharedSupabaseClient();
            if (!client || cancelled) return;

            const channel = client
                .channel(realtimeChannel.topic, { config: { broadcast: { self: false } } })
                .on('broadcast', { event: realtimeChannel.event }, (message) => {
                    const payload = message.payload as { state?: State | null } | undefined;
                    applyIncomingStateRef.current(payload?.state ?? null);
                })
                .subscribe((status) => {
                    if (cancelled) return;
                    if (status === 'SUBSCRIBED') {
                        setRealtimeLive(true);
                        syncAc?.abort();
                        syncAc = new AbortController();
                        void pollRef.current(syncAc.signal);
                    } else {
                        setRealtimeLive(false);
                    }
                });

            cleanup = () => {
                void client.removeChannel(channel);
            };
            if (cancelled) cleanup();
        })();

        return () => {
            cancelled = true;
            syncAc?.abort();
            cleanup?.();
            setRealtimeLive(false);
        };
    }, [realtimeChannel]);

    // Con realtime no hay GET en reposo; solo uno al caducar el estado en KV.
    useEffect(() => {
        if (!realtimeLive || !hasOverlayPollCredentials(session)) return;
        const ac = new AbortController();
        const id = window.setTimeout(() => {
            void pollRef.current(ac.signal);
        }, OVERLAY_STATE_EXPIRY_CHECK_MS);
        return () => {
            clearTimeout(id);
            ac.abort();
        };
    }, [realtimeLive, state, session]);

    // Intervalo adaptativo (respaldo sin realtime): reinicia el timer sin GET extra.
    useEffect(() => {
        if (!hasOverlayPollCredentials(session)) return;
        if (pollIntervalMs === null || realtimeLive) return;

        let tickAc: AbortController | null = null;
        const id = window.setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
            tickAc?.abort();
            tickAc = new AbortController();
            void poll(tickAc.signal);
        }, pollIntervalMs);

        return () => {
            clearInterval(id);
            tickAc?.abort();
        };
    }, [sessionKey, poll, pollIntervalMs, session, realtimeLive]);

    useEffect(() => {
        const id = window.setInterval(() => {
            if (realtimeLiveRef.current) {
                setStale(false);
                return;
            }
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

    return { state, connected, stale, unauthorized, retrying, retry };
}
