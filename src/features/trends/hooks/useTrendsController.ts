import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS, type Session } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { chatLogStore } from '@/features/chat/lib/chatLogStore';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import { rankWordCounts } from '@/features/trends/lib/rankWordCounts';
import type { TrendsOverlayState } from '@/features/overlay/lib/types';

const STOP_WORDS = new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'en', 'de', 'del',
    'a', 'al', 'con', 'para', 'por', 'que', 'qué', 'es', 'son', 'se', 'mi', 'tu', 'su', 'yo', 'me', 'te', 'le',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'como', 'cómo', 'cuando', 'cuándo', 'donde',
    'dónde', 'quien', 'quién', 'solo', 'sólo', 'tan', 'muy', 'mucho', 'poco', 'más', 'menos', 'http', 'https',
    'www', 'com'
]);

const LISTENER_ID = 'trends';

export interface UseTrendsControllerOptions {
    session: Session;
    active?: boolean;
    onStateChange?: (state: TrendsOverlayState) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useTrendsController({
    session,
    active = true,
    onStateChange,
    showToast
}: UseTrendsControllerOptions) {
    const [minutes, setMinutes] = useState(5);
    const durationMinutesRef = useRef(5);
    const [tracking, setTracking] = useState(false);
    const [connected, setConnected] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [timerEnded, setTimerEnded] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [isLeader, setIsLeader] = useState(false);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

    const wordCountsRef = useRef(wordCounts);
    wordCountsRef.current = wordCounts;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const syncRef = useRef<TabSyncService | null>(null);
    const trackingRef = useRef(tracking);
    trackingRef.current = tracking;
    const remainingRef = useRef(remaining);
    remainingRef.current = remaining;
    const endTimerRef = useRef<(fromError?: boolean) => void>(() => {});
    const completeTimerRef = useRef<() => void>(() => {});
    const remainingTickRef = useRef(0);
    const timerEndsAtRef = useRef<number | undefined>(undefined);
    const runTimerRef = useRef<(seconds: number) => void>(() => {});
    const localEndTimerRef = useRef<(fromError?: boolean) => void>(() => {});
    const localResetRef = useRef<() => void>(() => {});
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;

    const displayName = session.displayName ?? session.login ?? 'Canal';

    const buildOverlayState = useCallback(
        (overrides: Partial<TrendsOverlayState> = {}): TrendsOverlayState => {
            if (overrides.timerEndsAt !== undefined) {
                timerEndsAtRef.current = overrides.timerEndsAt;
            }
            if (overrides.tracking === false || overrides.timerEnded === true) {
                timerEndsAtRef.current = undefined;
            }

            return {
                tracking: overrides.tracking ?? tracking,
                remaining: overrides.remaining ?? remainingRef.current,
                timerEnded: overrides.timerEnded ?? timerEnded,
                wordCounts: overrides.wordCounts ?? wordCounts,
                minutes: overrides.minutes ?? durationMinutesRef.current,
                displayName: overrides.displayName ?? displayName,
                sessionActive: overrides.sessionActive ?? sessionActive,
                timerEndsAt: timerEndsAtRef.current,
                updatedAt: Date.now()
            };
        },
        [tracking, timerEnded, wordCounts, displayName, sessionActive]
    );

    const buildOverlayStateRef = useRef(buildOverlayState);
    buildOverlayStateRef.current = buildOverlayState;

    const emitState = useCallback((overrides: Partial<TrendsOverlayState> = {}) => {
        onStateChangeRef.current?.(buildOverlayStateRef.current(overrides));
    }, []);

    const adjustMinutes = useCallback((delta: number) => {
        setMinutes((prev) => {
            const next = Math.min(60, Math.max(1, prev + delta));
            durationMinutesRef.current = next;
            return next;
        });
    }, []);

    const applyMinutesInput = useCallback((raw: string) => {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;
        const next = Math.min(60, Math.max(1, parsed));
        durationMinutesRef.current = next;
        setMinutes(next);
    }, []);

    const processMessage = useCallback((msg: string, username: string) => {
        chatLogStore.add(username, msg);
        const firstWord = msg
            .toLowerCase()
            .split(/\s+/)[0]
            ?.replace(/[^\wñáéíóúü]/g, '');
        if (firstWord && firstWord.length > 2 && !STOP_WORDS.has(firstWord)) {
            setWordCounts((prev) => {
                const next = { ...prev, [firstWord]: (prev[firstWord] || 0) + 1 };
                if (syncRef.current?.getIsLeader()) {
                    syncRef.current.broadcast('TRENDS_UPDATE_COUNTS', { counts: next });
                }
                return next;
            });
        }
    }, []);

    const updateStatus = useCallback((isConnected: boolean) => {
        setConnected(isConnected);
    }, []);

    const handleChatMessage = useCallback(
        (_ch: string, tags: { username?: string }, message: string) => {
            if (!trackingRef.current) return;
            const username = tags.username;
            if (!username || IGNORED_BOTS.has(username.toLowerCase())) return;
            processMessage(message, username);
        },
        [processMessage]
    );

    useTmiChat(LISTENER_ID, {
        channel: session.login,
        session,
        enabled: tracking && isLeader,
        onMessage: handleChatMessage,
        onConnected: () => updateStatus(true),
        onError: () => {
            updateStatus(false);
            showToast('Error al conectar con el chat', 'error');
            endTimerRef.current(true);
        }
    });

    useEffect(() => {
        if (!(tracking && isLeader)) {
            updateStatus(false);
        }
    }, [tracking, isLeader, updateStatus]);

    const localEndTimer = useCallback(
        (fromError = false) => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            remainingTickRef.current = 0;
            setTracking(false);
            setTimerEnded(true);
            updateStatus(false);

            if (!fromError) {
                const entries = Object.entries(wordCountsRef.current);
                if (entries.length > 0) {
                    const sorted = entries.sort((a, b) => b[1] - a[1]);
                    showToast(`Ganador: "${sorted[0][0]}" (${sorted[0][1]})`, 'success');
                } else {
                    showToast('¡Tiempo terminado!', 'success');
                }
            }
            setMinutes(durationMinutesRef.current);
            emitState({ tracking: false, timerEnded: true, remaining: 0, timerEndsAt: undefined });
        },
        [showToast, updateStatus, emitState]
    );

    endTimerRef.current = localEndTimer;
    localEndTimerRef.current = localEndTimer;

    const endTimer = useCallback(() => {
        syncRef.current?.broadcast('TRENDS_END', null);
        localEndTimer();
    }, [localEndTimer]);

    completeTimerRef.current = endTimer;

    const runTimer = useCallback(
        (seconds: number) => {
            remainingTickRef.current = seconds;
            setRemaining(seconds);
            remainingRef.current = seconds;
            setTimerEnded(false);
            timerEndsAtRef.current = Date.now() + seconds * 1000;
            if (timerRef.current) clearInterval(timerRef.current);

            timerRef.current = setInterval(() => {
                if (remainingTickRef.current <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    remainingTickRef.current = 0;
                    remainingRef.current = 0;
                    setRemaining(0);
                    if (syncRef.current?.getIsLeader()) {
                        completeTimerRef.current();
                    }
                    return;
                }
                remainingTickRef.current -= 1;
                remainingRef.current = remainingTickRef.current;
                setRemaining(remainingTickRef.current);
            }, 1000);
        },
        []
    );

    runTimerRef.current = runTimer;

    const localReset = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        remainingTickRef.current = 0;
        remainingRef.current = 0;
        timerEndsAtRef.current = undefined;
        setTracking(false);
        setTimerEnded(false);
        setSessionActive(false);
        setRemaining(0);
        setWordCounts({});
        setMinutes(durationMinutesRef.current);
        chatLogStore.clear();
        updateStatus(false);
        emitState({
            tracking: false,
            timerEnded: false,
            sessionActive: false,
            remaining: 0,
            wordCounts: {},
            timerEndsAt: undefined
        });
    }, [updateStatus, emitState]);

    const reset = useCallback(() => {
        syncRef.current?.broadcast('TRENDS_RESET', null);
        localReset();
    }, [localReset]);

    localResetRef.current = localReset;

    const startTracking = useCallback(async () => {
        if (trackingRef.current) return;

        durationMinutesRef.current = minutes;
        syncRef.current?.broadcast('TRENDS_START', minutes);
        setTracking(true);
        setSessionActive(true);
        setWordCounts({});
        chatLogStore.clear();

        if (syncRef.current?.getIsLeader()) {
            void fetch(`${API_ENDPOINTS.BASE}/dashboard/track-usage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ tool: 'trends' })
            }).catch(() => {});
        }

        runTimer(minutes * 60);
        showToast(`Tracker iniciado (${minutes} min)`, 'success');
        emitState({
            tracking: true,
            sessionActive: true,
            wordCounts: {},
            remaining: minutes * 60,
            timerEnded: false,
            minutes,
            timerEndsAt: Date.now() + minutes * 60 * 1000
        });
    }, [minutes, session, runTimer, showToast, emitState]);

    useEffect(() => {
        if (!active && !trackingRef.current) {
            setIsLeader(false);
            if (syncRef.current) {
                syncRef.current.destroy();
                syncRef.current = null;
            }
            return;
        }

        if (syncRef.current) return;

        const sync = new TabSyncService('dashboard_trends_sync');
        syncRef.current = sync;

        sync.on('TRENDS_START', (payload) => {
            const mins = payload as number;
            durationMinutesRef.current = mins;
            setMinutes(mins);
            setTracking(true);
            setSessionActive(true);
            setWordCounts({});
            chatLogStore.clear();
            runTimerRef.current(mins * 60);
            emitState({
                tracking: true,
                sessionActive: true,
                wordCounts: {},
                remaining: mins * 60,
                timerEnded: false,
                minutes: mins,
                timerEndsAt: Date.now() + mins * 60 * 1000
            });
            if (!sync.getIsLeader()) {
                showToastRef.current(`Tracker iniciado (${mins} min)`, 'success');
            }
        });

        sync.on('TRENDS_UPDATE_COUNTS', (payload) => {
            const data = payload as { counts: Record<string, number> };
            setWordCounts(data.counts);
        });

        sync.on('TRENDS_END', () => {
            localEndTimerRef.current();
        });

        sync.on('TRENDS_RESET', () => {
            localResetRef.current();
        });

        sync.on('LEADER_CHANGED', (payload) => {
            const data = payload as { isLeader: boolean };
            setIsLeader(data.isLeader);
        });

        return () => {
            sync.destroy();
            syncRef.current = null;
        };
    }, [active, emitState]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, []);

    useEffect(() => {
        emitState();
    }, [tracking, timerEnded, sessionActive, emitState]);

    useEffect(() => {
        if (!tracking) return;
        emitState();
    }, [wordCounts, tracking, emitState]);

    const { ranked, maxCount } = rankWordCounts(wordCounts);

    return {
        minutes,
        adjustMinutes,
        applyMinutesInput,
        tracking,
        connected,
        remaining,
        timerEnded,
        sessionActive,
        isLeader,
        wordCounts,
        ranked,
        maxCount,
        displayName,
        startTracking,
        reset
    };
}
