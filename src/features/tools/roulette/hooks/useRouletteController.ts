import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS, type Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { tmiService } from '@/features/chat/lib/tmiService';
import type { RouletteUser } from '@/core/types/twitch';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { TabSyncService } from '@/features/dashboard/lib/tabSyncService';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    filtersToApiParam,
    hasAnyFilter,
    isAllFilters,
    rolesFromTags,
    tagsMatchFilters,
    userMatchesFilters,
    type EligibilityFilters
} from '@/features/tools/lib/eligibility';
import { winnerIndex } from '@/features/tools/roulette/lib/wheelUtils';
import type { RouletteOverlayState } from '@/features/overlay/lib/types';
import { useTranslation } from '@/core/i18n/I18nContext';
import { normalizeChatKeyword } from '@/features/tools/lib/normalizeChatKeyword';
import {
    appendWinnerHistory,
    clearWinnerHistory,
    readEntryModePref,
    readKeywordPref,
    readWinnerHistory,
    writeEntryModePref,
    writeKeywordPref,
    type RouletteEntryMode,
    type RouletteWinnerHistoryEntry
} from '@/features/tools/roulette/lib/roulettePrefs';

const LISTENER_ID = 'roulette';
const ANNOUNCE_WINNER_PREF = 'roulette_announce_winner';
const LEGACY_ANNOUNCE_WINNER_KEY = 'roulette_announce_winner_in_chat';
const WHEEL_COLOR_PREF = 'roulette_obs_wheel_color';
const CHATTERS_CLIENT_TTL_MS = 40_000;

function readWheelColorPref(userId?: string): string {
    const stored = readScopedPref(WHEEL_COLOR_PREF, userId);
    return stored || 'auto';
}

export function writeWheelColorPref(userId: string | undefined, color: string): void {
    writeScopedPref(WHEEL_COLOR_PREF, userId, color);
}

function readAnnounceWinnerPref(userId?: string): boolean {
    const stored = readScopedPref(ANNOUNCE_WINNER_PREF, userId, LEGACY_ANNOUNCE_WINNER_KEY);
    return stored === null ? true : stored === '1';
}

export function writeAnnounceWinnerPref(userId: string | undefined, enabled: boolean): void {
    writeScopedPref(ANNOUNCE_WINNER_PREF, userId, enabled ? '1' : '0', LEGACY_ANNOUNCE_WINNER_KEY);
}

export interface UseRouletteControllerOptions {
    session: Session;
    active?: boolean;
    onStateChange?: (state: RouletteOverlayState) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useRouletteController({
    session,
    active = true,
    onStateChange,
    showToast
}: UseRouletteControllerOptions) {
    const [wheelRotation, setWheelRotation] = useState(0);
    const [wheelTransition, setWheelTransition] = useState('none');
    const spinMetaRef = useRef<{
        targetRotation: number;
        participants: RouletteUser[];
    } | null>(null);
    const [chatters, setChatters] = useState<RouletteUser[]>([]);
    const [filters, setFilters] = useState<EligibilityFilters>(DEFAULT_ELIGIBILITY_FILTERS);
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<RouletteUser | null>(null);
    const [countPulse, setCountPulse] = useState(false);
    const pulseTimerRef = useRef<number | null>(null);
    const [lastSpinCount, setLastSpinCount] = useState(0);
    const [announceWinnerInChat, setAnnounceWinnerInChat] = useState(true);
    const [wheelColor, setWheelColorState] = useState<string>(() =>
        readWheelColorPref(session.userId)
    );
    const [entryMode, setEntryModeState] = useState<RouletteEntryMode>(() =>
        readEntryModePref(session.userId)
    );
    const [keywordInput, setKeywordInputState] = useState(() => readKeywordPref(session.userId));
    const [winnerHistory, setWinnerHistory] = useState<RouletteWinnerHistoryEntry[]>(() =>
        readWinnerHistory(session.userId)
    );
    const wheelColorRef = useRef(wheelColor);
    wheelColorRef.current = wheelColor;
    const entryModeRef = useRef(entryMode);
    entryModeRef.current = entryMode;
    const keywordRef = useRef(normalizeChatKeyword(keywordInput, '!sorteo'));
    keywordRef.current = normalizeChatKeyword(keywordInput, '!sorteo');
    const spinSeqRef = useRef(0);
    const [spinSeq, setSpinSeq] = useState(0);
    const targetRotationRef = useRef<number | undefined>(undefined);
    const spinDurationRef = useRef<number | undefined>(undefined);
    const syncRef = useRef<TabSyncService | null>(null);
    const chattersRef = useRef(chatters);
    chattersRef.current = chatters;
    const spinRef = useRef<() => void>(() => undefined);

    const { t } = useTranslation();
    const gT = t.globals.toasts;
    const gTRef = useRef(gT);
    gTRef.current = gT;

    const isOpenRef = useRef(isOpen);
    const isSpinningRef = useRef(isSpinning);
    const filtersRef = useRef(filters);
    const wheelRotationRef = useRef(wheelRotation);
    const wheelTransitionRef = useRef(wheelTransition);
    const onStateChangeRef = useRef(onStateChange);
    isOpenRef.current = isOpen;
    isSpinningRef.current = isSpinning;
    filtersRef.current = filters;
    wheelRotationRef.current = wheelRotation;
    wheelTransitionRef.current = wheelTransition;
    onStateChangeRef.current = onStateChange;

    const buildOverlayState = useCallback(
        (overrides: Partial<RouletteOverlayState> = {}): RouletteOverlayState => ({
            chatters,
            isOpen,
            isSpinning,
            wheelRotation: wheelRotationRef.current,
            wheelTransition: wheelTransitionRef.current,
            winner,
            lastSpinCount,
            spinSeq: spinSeqRef.current,
            targetRotation: targetRotationRef.current,
            spinDuration: spinDurationRef.current,
            wheelColor: wheelColorRef.current,
            updatedAt: Date.now(),
            ...overrides
        }),
        [chatters, isOpen, isSpinning, winner, lastSpinCount]
    );

    const buildOverlayStateRef = useRef(buildOverlayState);
    buildOverlayStateRef.current = buildOverlayState;

    const emitState = useCallback((overrides: Partial<RouletteOverlayState> = {}) => {
        onStateChangeRef.current?.(buildOverlayStateRef.current(overrides));
    }, []);

    const setWheelColor = useCallback(
        (color: string) => {
            setWheelColorState(color);
            wheelColorRef.current = color;
            writeWheelColorPref(session.userId, color);
            emitState({ wheelColor: color });
        },
        [session.userId, emitState]
    );

    const pulseCounter = useCallback(() => {
        setCountPulse(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setCountPulse(false), 500);
    }, []);

    const lastFetchAtRef = useRef(0);
    const inFlightRef = useRef<Promise<void> | null>(null);

    const loadChatters = useCallback(
        async (opts?: { force?: boolean }) => {
            if (!session.login) return;

            const now = Date.now();
            if (
                !opts?.force &&
                lastFetchAtRef.current > 0 &&
                now - lastFetchAtRef.current < CHATTERS_CLIENT_TTL_MS
            ) {
                return;
            }
            if (inFlightRef.current) return inFlightRef.current;

            const run = (async () => {
                if (isAllFilters(filtersRef.current)) {
                    setChatters((prev) => {
                        const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                        if (existing.has(session.login!.toLowerCase())) return prev;
                        pulseCounter();
                        return [
                            ...prev,
                            {
                                user_login: session.login!,
                                user_name: session.displayName || session.login!
                            }
                        ];
                    });
                }

                try {
                    const needsRoles = !isAllFilters(filtersRef.current);
                    const params = new URLSearchParams({
                        channel: session.login!,
                        eligibility: filtersToApiParam(filtersRef.current),
                        source: 'roulette',
                        annotate: needsRoles ? '1' : '0'
                    });
                    const res = await fetch(
                        `${API_ENDPOINTS.CHATTERS}?${params}`,
                        withApiCredentials({
                            headers: authHeaders(session)
                        })
                    );
                    if (!res.ok) {
                        if (!syncRef.current?.getIsLeader()) {
                            showToast(gTRef.current.rouletteLoadError, 'error');
                        }
                        return;
                    }
                    const data = await res.json();
                    const list: (string | RouletteUser)[] = Array.isArray(data)
                        ? data
                        : data.chatters ?? [];

                    setChatters((prev) => {
                        const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                        const next = [...prev];
                        let added = 0;
                        list.forEach((item) => {
                            const login = typeof item === 'string' ? item : item.user_login;
                            const name = typeof item === 'string' ? item : item.user_name;
                            const mod = typeof item === 'string' ? undefined : item.mod;
                            const sub = typeof item === 'string' ? undefined : item.sub;
                            const vip = typeof item === 'string' ? undefined : item.vip;
                            if (!login) return;
                            const lower = login.toLowerCase();
                            if (!existing.has(lower) && !IGNORED_BOTS.has(lower)) {
                                next.push({
                                    user_login: login,
                                    user_name: name || login,
                                    mod,
                                    sub,
                                    vip
                                });
                                existing.add(lower);
                                added++;
                            } else if (existing.has(lower) && needsRoles) {
                                const idx = next.findIndex(
                                    (u) => u.user_login.toLowerCase() === lower
                                );
                                if (idx >= 0) {
                                    next[idx] = {
                                        ...next[idx],
                                        mod: mod ?? next[idx].mod,
                                        sub: sub ?? next[idx].sub,
                                        vip: vip ?? next[idx].vip
                                    };
                                }
                            }
                        });
                        if (added > 0) pulseCounter();
                        return next.filter((u) => userMatchesFilters(u, filtersRef.current));
                    });
                    lastFetchAtRef.current = Date.now();
                } catch {
                    showToast(gTRef.current.rouletteLoadError, 'error');
                } finally {
                    inFlightRef.current = null;
                }
            })();

            inFlightRef.current = run;
            return run;
        },
        [session, showToast, pulseCounter]
    );

    const handleTmiMessage = useCallback(
        (_ch: string, tags: Parameters<typeof tagsMatchFilters>[0], message: string) => {
            if (isSpinningRef.current || !isOpenRef.current) return;
            if (!tagsMatchFilters(tags, filtersRef.current)) return;
            const login = tags.username;
            if (!login || IGNORED_BOTS.has(login.toLowerCase())) return;

            if (entryModeRef.current === 'keyword') {
                const kw = keywordRef.current;
                if (!message.trim().toLowerCase().startsWith(kw.toLowerCase())) return;
            }

            const roles = rolesFromTags(tags);
            setChatters((prev) => {
                if (prev.some((u) => u.user_login.toLowerCase() === login.toLowerCase())) {
                    return prev;
                }
                pulseCounter();
                return [
                    ...prev,
                    {
                        user_login: login,
                        user_name: tags['display-name'] || login,
                        ...roles
                    }
                ];
            });
        },
        [pulseCounter]
    );

    useTmiChat(LISTENER_ID, {
        channel: session.login,
        session,
        enabled: active && isOpen,
        onMessage: handleTmiMessage,
        onError: () => {
            showToast(gTRef.current.rouletteChatError, 'error');
            setIsOpen(false);
        }
    });

    const sendViaApi = useCallback(
        (message: string) => {
            void fetch(API_ENDPOINTS.SEND_MESSAGE, withApiCredentials({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ message })
            })).catch(() => showToast(gTRef.current.rouletteSendError, 'error'));
        },
        [session, showToast]
    );

    const sendWinnerMessage = useCallback(
        (winMsg: string) => {
            if (tmiService.isConnected) {
                void tmiService.say(session.login!, winMsg).catch(() => sendViaApi(winMsg));
            } else {
                sendViaApi(winMsg);
            }
        },
        [session.login, sendViaApi]
    );

    const finishSpin = useCallback(
        (finalRotation: number, participants: RouletteUser[]) => {
            setWheelTransition('none');
            wheelTransitionRef.current = 'none';
            setIsSpinning(false);
            targetRotationRef.current = undefined;
            spinDurationRef.current = undefined;

            const index = winnerIndex(finalRotation, participants.length);
            const picked = participants[index];
            setWinner(picked);

            const count = participants.length;
            setLastSpinCount(count);
            setWinnerHistory(appendWinnerHistory(session.userId, picked, count));
            showToast(gTRef.current.rouletteWinner(picked.user_name, count), 'success');
            if (announceWinnerInChat) {
                sendWinnerMessage(gTRef.current.rouletteChatWinner(picked.user_name, count));
            }
            void import('canvas-confetti').then(({ default: confetti }) => {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#9146ff', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9']
                });
            });

            emitState({
                isSpinning: false,
                wheelRotation: finalRotation,
                wheelTransition: 'none',
                winner: picked,
                lastSpinCount: count,
                targetRotation: undefined,
                spinDuration: undefined
            });
        },
        [announceWinnerInChat, sendWinnerMessage, showToast, emitState, session.userId]
    );

    const spin = useCallback(() => {
        if (isSpinningRef.current || chatters.length === 0) return;

        const participants = [...chatters];
        setIsSpinning(true);
        setWinner(null);

        const extraTurns = 5 + Math.random() * 4;
        const totalDelta = 360 * extraTurns + Math.random() * 360;
        const duration = 4200 + Math.random() * 2800;
        const targetRotation = wheelRotationRef.current + totalDelta;

        spinMetaRef.current = { targetRotation, participants };
        spinSeqRef.current += 1;
        setSpinSeq(spinSeqRef.current);
        targetRotationRef.current = targetRotation;
        spinDurationRef.current = duration;

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setWheelRotation(targetRotation);
            wheelRotationRef.current = targetRotation;
            setWheelTransition('none');
            wheelTransitionRef.current = 'none';
            finishSpin(targetRotation, participants);
            return;
        }

        setWheelTransition('none');
        wheelTransitionRef.current = 'none';
        // Un solo PUT: OBS anima con targetRotation/spinDuration (applyRouletteSpin).
        // El rAF solo mueve la ruleta del panel — no republicar (huella distinta = 2º PUT).
        emitState({
            isSpinning: true,
            winner: null,
            spinSeq: spinSeqRef.current,
            targetRotation,
            spinDuration: duration,
            wheelTransition: 'none'
        });

        requestAnimationFrame(() => {
            const transition = `transform ${Math.round(duration)}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
            setWheelTransition(transition);
            wheelTransitionRef.current = transition;
            setWheelRotation(targetRotation);
            wheelRotationRef.current = targetRotation;
        });
    }, [chatters, finishSpin, emitState]);
    spinRef.current = spin;

    const onWheelTransitionEnd = useCallback(
        (e: TransitionEvent<HTMLDivElement>) => {
            if (e.propertyName !== 'transform') return;
            const meta = spinMetaRef.current;
            if (!meta || !isSpinningRef.current) return;
            spinMetaRef.current = null;
            finishSpin(meta.targetRotation, meta.participants);
        },
        [finishSpin]
    );

    const toggleOpen = useCallback(async () => {
        if (isOpen) {
            setIsOpen(false);
            showToast(gTRef.current.rouletteInscriptionsClosed, 'info');
            emitState({ isOpen: false });
            return;
        }
        if (!hasAnyFilter(filters)) {
            showToast(gTRef.current.rouletteMissingFilter, 'warning');
            return;
        }
        setIsOpen(true);
        setChatters([]);
        setWinner(null);
        setLastSpinCount(0);
        lastFetchAtRef.current = 0;
        showToast(gTRef.current.rouletteInscriptionsOpened, 'success');
        emitState({ isOpen: true, chatters: [], winner: null, lastSpinCount: 0 });
    }, [isOpen, filters, showToast, emitState]);

    const toggleAnnounceWinner = useCallback(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat((prev) => {
            const next = !prev;
            writeAnnounceWinnerPref(session.userId!, next);
            showToast(next ? gTRef.current.rouletteAnnounceOn : gTRef.current.rouletteAnnounceOff, 'info');
            return next;
        });
    }, [session.userId, showToast]);

    const setEntryMode = useCallback(
        (mode: RouletteEntryMode) => {
            if (isOpenRef.current || isSpinningRef.current) return;
            setEntryModeState(mode);
            writeEntryModePref(session.userId, mode);
        },
        [session.userId]
    );

    const setKeywordInput = useCallback(
        (value: string) => {
            if (isOpenRef.current || isSpinningRef.current) return;
            const cleaned = value.replace(/^!+/, '');
            setKeywordInputState(cleaned);
            writeKeywordPref(session.userId, cleaned);
        },
        [session.userId]
    );

    const dismissWinner = useCallback(() => {
        setWinner(null);
        emitState({ winner: null });
    }, [emitState]);

    const removeWinnerAndRespin = useCallback(() => {
        const currentWinner = winner;
        if (!currentWinner || isSpinningRef.current) return;

        const filtered = chattersRef.current.filter(
            (u) => u.user_login.toLowerCase() !== currentWinner.user_login.toLowerCase()
        );
        setChatters(filtered);
        setWinner(null);
        emitState({ winner: null, chatters: filtered });

        if (filtered.length === 0) {
            showToast(gTRef.current.rouletteNoParticipantsLeft, 'error');
            return;
        }

        requestAnimationFrame(() => spinRef.current());
    }, [winner, emitState, showToast]);

    const clearHistory = useCallback(() => {
        clearWinnerHistory(session.userId);
        setWinnerHistory([]);
    }, [session.userId]);

    useEffect(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat(readAnnounceWinnerPref(session.userId));
        setEntryModeState(readEntryModePref(session.userId));
        setKeywordInputState(readKeywordPref(session.userId));
        setWinnerHistory(readWinnerHistory(session.userId));
    }, [session.userId]);

    useEffect(() => {
        setChatters((prev) => prev.filter((u) => userMatchesFilters(u, filters)));
        if (!isOpen || entryModeRef.current !== 'presence') return;
        void loadChatters({ force: !isAllFilters(filters) });
    }, [filters, isOpen, loadChatters]);

    useEffect(() => {
        if (!active) {
            setIsOpen(false);
            return;
        }
    }, [active]);

    useEffect(() => {
        return () => {
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        };
    }, []);

    useEffect(() => {
        emitState();
    }, [chatters, isOpen, isSpinning, winner, lastSpinCount, spinSeq, emitState]);

    return {
        chatters,
        filters,
        setFilters,
        isOpen,
        isSpinning,
        winner,
        countPulse,
        lastSpinCount,
        announceWinnerInChat,
        entryMode,
        setEntryMode,
        keywordInput,
        setKeywordInput,
        keyword: keywordRef.current,
        winnerHistory,
        clearHistory,
        wheelRotation,
        wheelTransition,
        spinSeq,
        wheelColor,
        setWheelColor,
        toggleOpen,
        loadChatters,
        spin,
        onWheelTransitionEnd,
        toggleAnnounceWinner,
        dismissWinner,
        removeWinnerAndRespin
    };
}
