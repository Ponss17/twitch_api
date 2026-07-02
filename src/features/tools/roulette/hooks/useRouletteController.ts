import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';
import confetti from 'canvas-confetti';
import { API_ENDPOINTS, IGNORED_BOTS, type Session } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { buildAuthQueryParam } from '@/core/api/authQuery';
import { useTmiChat } from '@/features/chat/hooks/useTmiChat';
import { tmiService } from '@/features/chat/lib/tmiService';
import type { RouletteUser } from '@/core/types/twitch';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    filtersToApiParam,
    hasAnyFilter,
    isAllFilters,
    rolesFromTags,
    tagsMatchFilters,
    userMatchesFilters,
    type RouletteEligibilityFilters
} from '@/features/tools/roulette/lib/eligibility';
import { winnerIndex } from '@/features/tools/roulette/lib/wheelUtils';
import type { RouletteOverlayState } from '@/features/tools/overlay/lib/types';

const LISTENER_ID = 'roulette';
const ANNOUNCE_WINNER_PREF = 'roulette_announce_winner';
const LEGACY_ANNOUNCE_WINNER_KEY = 'roulette_announce_winner_in_chat';

function readAnnounceWinnerPref(userId: string): boolean {
    const stored = readScopedPref(ANNOUNCE_WINNER_PREF, userId, LEGACY_ANNOUNCE_WINNER_KEY);
    return stored === null ? true : stored === '1';
}

export function writeAnnounceWinnerPref(userId: string, enabled: boolean): void {
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
    const [filters, setFilters] = useState<RouletteEligibilityFilters>(DEFAULT_ELIGIBILITY_FILTERS);
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<RouletteUser | null>(null);
    const [countPulse, setCountPulse] = useState(false);
    const pulseTimerRef = useRef<number | null>(null);
    const [lastSpinCount, setLastSpinCount] = useState(0);
    const [announceWinnerInChat, setAnnounceWinnerInChat] = useState(true);
    const spinSeqRef = useRef(0);
    const [spinSeq, setSpinSeq] = useState(0);
    const targetRotationRef = useRef<number | undefined>(undefined);
    const spinDurationRef = useRef<number | undefined>(undefined);

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

    const pulseCounter = useCallback(() => {
        setCountPulse(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setCountPulse(false), 500);
    }, []);

    const loadChatters = useCallback(async () => {
        if (!session.login) return;

        if (isAllFilters(filtersRef.current)) {
            setChatters((prev) => {
                const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                if (existing.has(session.login!.toLowerCase())) return prev;
                pulseCounter();
                return [
                    ...prev,
                    { user_login: session.login!, user_name: session.displayName || session.login! }
                ];
            });
        }

        try {
            const params = new URLSearchParams({
                channel: session.login,
                eligibility: filtersToApiParam(filtersRef.current)
            });
            const res = await fetch(`${API_ENDPOINTS.CHATTERS}?${params}`, {
                headers: authHeaders(session)
            });
            if (!res.ok) {
                if (!isAllFilters(filtersRef.current)) {
                    showToast(
                        'No se pudo filtrar participantes. Vuelve a iniciar sesión con Twitch si el filtro es nuevo.',
                        'error'
                    );
                }
                return;
            }
            const data = await res.json();
            const list: (string | RouletteUser)[] = Array.isArray(data) ? data : data.chatters ?? [];

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
                    }
                });
                if (added > 0) pulseCounter();
                return next.filter((u) => userMatchesFilters(u, filtersRef.current));
            });
        } catch {
            showToast('Error al cargar usuarios del chat', 'error');
        }
    }, [session, showToast, pulseCounter]);

    const handleTmiMessage = useCallback(
        (_ch: string, tags: Parameters<typeof tagsMatchFilters>[0]) => {
            if (isSpinningRef.current || !isOpenRef.current) return;
            if (!tagsMatchFilters(tags, filtersRef.current)) return;
            const login = tags.username;
            if (!login || IGNORED_BOTS.has(login.toLowerCase())) return;
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
            showToast('Error al conectar con el chat', 'error');
            setIsOpen(false);
        }
    });

    const sendViaApi = useCallback(
        (message: string) => {
            const { apiKey, token } = session;
            const authParam = buildAuthQueryParam({ apiKey, token });
            if (!authParam) return;

            void fetch(`${API_ENDPOINTS.SEND_MESSAGE}?${authParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                body: JSON.stringify({ message })
            }).catch(() => showToast('No se pudo enviar el resultado al chat', 'error'));
        },
        [session, showToast]
    );

    const sendWinnerMessage = useCallback(
        (winMsg: string) => {
            if (tmiService.isConnected && tmiService.client) {
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
            showToast(`Ganador: @${picked.user_name} (${count})`, 'success');
            if (announceWinnerInChat) {
                sendWinnerMessage(
                    `¡El ganador es @${picked.user_name}! (De ${count} participantes) ¡Felicidades!`
                );
            }
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#9146ff', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9']
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
        [announceWinnerInChat, sendWinnerMessage, showToast, emitState]
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
            emitState({ wheelTransition: transition, wheelRotation: targetRotation });
        });
    }, [chatters, finishSpin, emitState]);

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
            showToast('Inscripciones Cerradas', 'info');
            emitState({ isOpen: false });
            return;
        }
        if (!hasAnyFilter(filters)) {
            showToast('Marca al menos un tipo de participante', 'warning');
            return;
        }
        setIsOpen(true);
        setChatters([]);
        setWinner(null);
        setLastSpinCount(0);
        showToast('Inscripciones Abiertas', 'success');
        emitState({ isOpen: true, chatters: [], winner: null, lastSpinCount: 0 });
        await loadChatters();
    }, [isOpen, filters, showToast, loadChatters, emitState]);

    const toggleAnnounceWinner = useCallback(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat((prev) => {
            const next = !prev;
            writeAnnounceWinnerPref(session.userId!, next);
            showToast(next ? 'Ganador visible en chat' : 'Ganador solo en panel', 'info');
            return next;
        });
    }, [session.userId, showToast]);

    const dismissWinner = useCallback(() => {
        setWinner(null);
        emitState({ winner: null });
    }, [emitState]);

    useEffect(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat(readAnnounceWinnerPref(session.userId));
    }, [session.userId]);

    useEffect(() => {
        setChatters((prev) => prev.filter((u) => userMatchesFilters(u, filters)));
        if (isOpen) void loadChatters();
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
        wheelRotation,
        wheelTransition,
        spinSeq,
        toggleOpen,
        loadChatters,
        spin,
        onWheelTransitionEnd,
        toggleAnnounceWinner,
        dismissWinner
    };
}
