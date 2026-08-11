import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';
import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { tmiService } from '@/features/chat/lib/tmiService';
import type { RouletteUser } from '@/core/types/twitch';
import { hasAnyFilter } from '@/features/tools/lib/eligibility';
import { winnerIndex } from '@/features/tools/roulette/lib/wheelUtils';
import type { RouletteOverlayState } from '@/features/overlay/lib/types';
import { useTranslation } from '@/core/i18n/I18nContext';
import {
    appendWinnerHistory,
    clearWinnerHistory,
    readAnnounceWinnerPref,
    readWheelColorPref,
    readWinnerHistory,
    writeAnnounceWinnerPref,
    writeWheelColorPref,
    type RouletteWinnerHistoryEntry
} from '@/features/tools/roulette/lib/roulettePrefs';
import { useRouletteChatters } from '@/features/tools/roulette/hooks/useRouletteChatters';

export {
    writeAnnounceWinnerPref,
    writeWheelColorPref
} from '@/features/tools/roulette/lib/roulettePrefs';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<RouletteUser | null>(null);
    const [lastSpinCount, setLastSpinCount] = useState(0);
    const [announceWinnerInChat, setAnnounceWinnerInChat] = useState(true);
    const [wheelColor, setWheelColorState] = useState<string>(() =>
        readWheelColorPref(session.userId)
    );
    const [winnerHistory, setWinnerHistory] = useState<RouletteWinnerHistoryEntry[]>(() =>
        readWinnerHistory(session.userId)
    );
    const wheelColorRef = useRef(wheelColor);
    wheelColorRef.current = wheelColor;
    const spinSeqRef = useRef(0);
    const [spinSeq, setSpinSeq] = useState(0);
    const targetRotationRef = useRef<number | undefined>(undefined);
    const spinDurationRef = useRef<number | undefined>(undefined);
    const spinRef = useRef<() => void>(() => undefined);

    const { t } = useTranslation();
    const gT = t.globals.toasts;
    const gTRef = useRef(gT);
    gTRef.current = gT;

    const isSpinningRef = useRef(isSpinning);
    const wheelRotationRef = useRef(wheelRotation);
    const wheelTransitionRef = useRef(wheelTransition);
    const onStateChangeRef = useRef(onStateChange);
    isSpinningRef.current = isSpinning;
    wheelRotationRef.current = wheelRotation;
    wheelTransitionRef.current = wheelTransition;
    onStateChangeRef.current = onStateChange;

    const {
        chatters,
        setChatters,
        chattersRef,
        filters,
        setFilters,
        countPulse,
        entryMode,
        setEntryMode,
        keywordInput,
        setKeywordInput,
        keyword,
        loadChatters,
        resetChattersForOpen
    } = useRouletteChatters({
        session,
        active,
        isOpen,
        isSpinning,
        showToast,
        onChatError: () => setIsOpen(false)
    });

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
        resetChattersForOpen();
        setWinner(null);
        setLastSpinCount(0);
        showToast(gTRef.current.rouletteInscriptionsOpened, 'success');
        emitState({ isOpen: true, chatters: [], winner: null, lastSpinCount: 0 });
    }, [isOpen, filters, showToast, emitState, resetChattersForOpen]);

    const toggleAnnounceWinner = useCallback(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat((prev) => {
            const next = !prev;
            writeAnnounceWinnerPref(session.userId!, next);
            showToast(next ? gTRef.current.rouletteAnnounceOn : gTRef.current.rouletteAnnounceOff, 'info');
            return next;
        });
    }, [session.userId, showToast]);

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
    }, [winner, emitState, showToast, setChatters, chattersRef]);

    const clearHistory = useCallback(() => {
        clearWinnerHistory(session.userId);
        setWinnerHistory([]);
    }, [session.userId]);

    useEffect(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat(readAnnounceWinnerPref(session.userId));
        setWinnerHistory(readWinnerHistory(session.userId));
    }, [session.userId]);

    useEffect(() => {
        if (!active) {
            setIsOpen(false);
            return;
        }
    }, [active]);

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
        keyword,
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
