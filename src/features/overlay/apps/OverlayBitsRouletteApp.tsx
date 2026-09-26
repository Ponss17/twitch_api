import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOverlayMirror } from '@/features/overlay/hooks/useOverlayMirror';
import { useRouletteOverlayVisible } from '@/features/overlay/hooks/useOverlayVisibilityClock';
import { RouletteWheelDisplay } from '@/features/tools/roulette/RouletteWheelDisplay';
import { OverlayAppearanceRoot } from '@/features/overlay/components/OverlayAppearanceRoot';
import { OverlayConnectionBanners } from '@/features/overlay/components/OverlayConnectionBanners';
import { OverlaySessionGate } from '@/features/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/overlay/components/OverlaySessionProvider';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import type { BitsRouletteOverlayState } from '@/features/overlay/lib/types';
import type { RouletteUser } from '@/core/types/twitch';
import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { I18nProvider, useTranslation } from '@/core/i18n/I18nContext';
import { useSession } from '@/core/session/useSession';
import { withApiCredentials } from '@/core/auth/apiCredentials';
import { overlayAuthHeaders } from '@/features/overlay/lib/overlayApi';
import { winnerIndex } from '@/features/tools/roulette/lib/wheelUtils';
import {
    BITS_ROULETTE_OPTIONS_HARD_MAX,
    isCheerFresh,
    matchesBitsThreshold,
    parseBitsRouletteUrlConfig,
    parseSpinBannerParts
} from '@/features/alerts/lib/bitsRouletteUrl';
import { playBitsConfettiSound } from '@/features/alerts/lib/bitsConfettiSound';
import { resolveWheelPalette } from '@/features/tools/roulette/lib/wheelUtils';

function optionsToChatters(options: string[]): RouletteUser[] {
    return options.map((label, i) => ({
        user_login: `prize_${i + 1}`,
        user_name: label
    }));
}

function decodeBase64UrlJson(token: string): string {
    const lastDot = token.lastIndexOf('.');
    if (lastDot <= 0) throw new Error('token');
    let padded = token.slice(0, lastDot).replace(/-/g, '+').replace(/_/g, '/');
    while (padded.length % 4) padded += '=';
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

/** Lee profile_image_url del overlayToken (payload público; sin verificar firma). */
function channelAvatarFromOverlayToken(token?: string): string | null {
    if (!token) return null;
    try {
        const data = JSON.parse(decodeBase64UrlJson(token)) as { profile_image_url?: string };
        return data.profile_image_url?.trim() || null;
    } catch {
        return null;
    }
}

/** Aparición antes del giro — da tiempo a leer los premios. */
const BITS_ENTER_MS = 900;
/** Duración de overlayPopOut. La entrada sigue en 0.45 s. */
const BITS_POP_MS = 220;

type BitsRoundPhase = 'idle' | 'enter' | 'spin' | 'result' | 'leave';

function maxPrizesFromOverlayToken(token?: string): number {
    if (!token) return BITS_ROULETTE_OPTIONS_HARD_MAX;
    try {
        const lastDot = token.lastIndexOf('.');
        if (lastDot <= 0) return BITS_ROULETTE_OPTIONS_HARD_MAX;
        const data = JSON.parse(decodeBase64UrlJson(token)) as { maxPrizes?: number };
        const max = Math.floor(Number(data.maxPrizes));
        if (max >= 2 && max <= BITS_ROULETTE_OPTIONS_HARD_MAX) return max;
    } catch {
        /* token ilegible: techo absoluto */
    }
    return BITS_ROULETTE_OPTIONS_HARD_MAX;
}

function OverlayBitsRouletteContent({ session }: { session: Session }) {
    const { session: panelSession } = useSession();
    const { t, locale } = useTranslation();
    const aT = t.alerts.bitsRoulette;
    const maxPrizes = useMemo(
        () => maxPrizesFromOverlayToken(session.overlayToken),
        [session.overlayToken]
    );
    const urlConfig = useMemo(
        () =>
            typeof window !== 'undefined'
                ? parseBitsRouletteUrlConfig(window.location.search, maxPrizes)
                : parseBitsRouletteUrlConfig('', maxPrizes),
        [maxPrizes]
    );
    const winnerHoldMs = urlConfig.winnerHoldSec * 1000;

    const channelAvatar = useMemo(
        () =>
            panelSession?.profile_image_url?.trim() ||
            session.profile_image_url?.trim() ||
            channelAvatarFromOverlayToken(session.overlayToken) ||
            null,
        [panelSession?.profile_image_url, session.profile_image_url, session.overlayToken]
    );

    const { state, connected, stale, unauthorized, retrying, retry } = useOverlayMirror(
        'bits-roulette',
        session
    );
    const remote = state as BitsRouletteOverlayState;

    const [local, setLocal] = useState<BitsRouletteOverlayState>(() => ({
        chatters: optionsToChatters(urlConfig.options),
        isOpen: false,
        isSpinning: false,
        wheelRotation: 0,
        wheelTransition: 'none',
        winner: null,
        lastSpinCount: urlConfig.options.length,
        spinSeq: 0,
        updatedAt: Date.now(),
        lastCheer: null
    }));
    const [phase, setPhase] = useState<BitsRoundPhase>('idle');

    const handledCheerId = useRef<string | null>(null);
    /** El primer poll solo ancla el cheer que ya estaba en KV. No se gira al recargar OBS. */
    const primedRef = useRef(false);
    const lastSpinAt = useRef(0);
    const wheelRotationRef = useRef(0);
    const timersRef = useRef<number[]>([]);
    /** Cierre de la ronda: no entra en timersRef para que ningún re-render lo cancele. */
    const hideTimerRef = useRef<number | null>(null);
    const leavingRef = useRef(false);
    const roundTokenRef = useRef(0);
    wheelRotationRef.current = local.wheelRotation;

    const clearSpinTimers = useCallback(() => {
        for (const id of timersRef.current) window.clearTimeout(id);
        timersRef.current = [];
    }, []);

    const schedule = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timersRef.current.push(id);
        return id;
    };

    const forceHide = useCallback(() => {
        leavingRef.current = false;
        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        clearSpinTimers();
        setPhase('idle');
        setLocal((prev) => ({
            ...prev,
            winner: null,
            isOpen: false,
            isSpinning: false,
            updatedAt: Date.now()
        }));
    }, [clearSpinTimers]);

    const requestLeave = useCallback(() => {
        if (leavingRef.current) return;
        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
            forceHide();
            return;
        }
        leavingRef.current = true;
        setPhase('leave');
    }, [forceHide]);

    const armHide = useCallback((ms: number) => {
        if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => {
            hideTimerRef.current = null;
            requestLeave();
        }, ms);
    }, [requestLeave]);

    useEffect(
        () => () => {
            clearSpinTimers();
            if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
        },
        [clearSpinTimers]
    );

    useEffect(() => {
        if (phase !== 'leave') return;
        const id = window.setTimeout(() => forceHide(), BITS_POP_MS);
        return () => window.clearTimeout(id);
    }, [phase, forceHide]);

    useEffect(() => {
        if (!connected) return;
        const cheer = remote?.lastCheer;
        if (!primedRef.current) {
            primedRef.current = true;
            handledCheerId.current = cheer?.id ?? null;
            return;
        }
        if (!cheer?.id || cheer.id === handledCheerId.current) return;
        if (!isCheerFresh(cheer.at)) {
            handledCheerId.current = cheer.id;
            return;
        }
        if (!matchesBitsThreshold(cheer.bits, urlConfig.threshold, urlConfig.matchMode)) {
            handledCheerId.current = cheer.id;
            return;
        }
        const now = Date.now();
        if (now - lastSpinAt.current < urlConfig.cooldownSec * 1000) {
            handledCheerId.current = cheer.id;
            return;
        }
        // Ya hay una ronda en curso (aparición / giro / ganador).
        if (phase !== 'idle' || local.isSpinning || local.isOpen || leavingRef.current) return;

        handledCheerId.current = cheer.id;
        lastSpinAt.current = now;
        clearSpinTimers();
        const token = ++roundTokenRef.current;

        const chatters = optionsToChatters(urlConfig.options);
        const extraTurns = 5 + Math.random() * 4;
        const totalDelta = 360 * extraTurns + Math.random() * 360;
        const duration = Math.round(4200 + Math.random() * 2800);
        const targetRotation = wheelRotationRef.current + totalDelta;
        const spinSeq = Date.now();
        const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const revealWinner = () => {
            if (roundTokenRef.current !== token) return;
            const idx = winnerIndex(targetRotation, chatters.length, 'top');
            setPhase('result');
            setLocal((prev) => ({
                ...prev,
                isSpinning: false,
                isOpen: false,
                wheelRotation: targetRotation,
                wheelTransition: 'none',
                winner: chatters[idx] ?? null,
                updatedAt: Date.now()
            }));
            if (
                urlConfig.confetti &&
                !(
                    typeof window !== 'undefined' &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches
                )
            ) {
                void import('canvas-confetti').then(({ default: confetti }) => {
                    confetti({
                        particleCount: 160,
                        spread: 90,
                        origin: { y: 0.55 },
                        colors: ['#9146ff', '#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9']
                    });
                });
            }
            playBitsConfettiSound(urlConfig.confettiSound);
            armHide(winnerHoldMs);
            if (urlConfig.announceChat && chatters[idx]) {
                void fetch(
                    API_ENDPOINTS.ALERTS_BITS_ROULETTE_ANNOUNCE,
                    withApiCredentials({
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...overlayAuthHeaders(session)
                        },
                        body: JSON.stringify({
                            cheerId: cheer.id,
                            prize: chatters[idx].user_name,
                            lang: locale === 'en' || locale === 'pt' ? locale : 'es'
                        })
                    })
                ).catch(() => undefined);
            }
        };

        // 1) Aparición (ruleta quieta con premios visibles).
        setPhase('enter');
        setLocal((prev) => ({
            ...prev,
            chatters,
            isOpen: true,
            isSpinning: false,
            winner: null,
            lastSpinCount: chatters.length,
            spinSeq,
            targetRotation,
            spinDuration: duration,
            wheelTransition: 'none',
            lastCheer: cheer,
            updatedAt: Date.now()
        }));

        const startSpin = () => {
            if (roundTokenRef.current !== token) return;
            if (prefersReduced) {
                revealWinner();
                return;
            }

            setPhase('spin');
            setLocal((prev) => ({
                ...prev,
                isSpinning: true,
                wheelTransition: 'none',
                updatedAt: Date.now()
            }));

            schedule(() => {
                if (roundTokenRef.current !== token) return;
                const transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
                setLocal((prev) => ({
                    ...prev,
                    wheelTransition: transition,
                    wheelRotation: targetRotation,
                    updatedAt: Date.now()
                }));
                schedule(() => revealWinner(), duration + 80);
            }, 40);
        };

        schedule(startSpin, prefersReduced ? 0 : BITS_ENTER_MS);
        // Red de seguridad: si el giro no cierra, igual se apaga.
        armHide(BITS_ENTER_MS + duration + winnerHoldMs + 1500);
    }, [connected, remote?.lastCheer, urlConfig, local.isSpinning, local.isOpen, phase, locale, session, armHide, clearSpinTimers, winnerHoldMs]);

    const display: BitsRouletteOverlayState = {
        ...local,
        chatters: local.chatters.length
            ? local.chatters
            : optionsToChatters(urlConfig.options),
        // isOpen solo durante la aparición. Si se queda en true, la ruleta no se apaga nunca.
        isOpen: phase === 'enter'
    };

    const visible = useRouletteOverlayVisible(display, winnerHoldMs);

    useEffect(() => {
        if (visible || phase === 'enter' || phase === 'spin' || phase === 'leave') return;
        if (!local.winner && !local.isOpen && phase === 'idle') return;
        requestLeave();
    }, [visible, phase, local.winner, local.isOpen, requestLeave]);

    if (!visible && phase !== 'leave') {
        return (
            <OverlayAppearanceRoot>
                <div className="min-h-screen" aria-hidden />
            </OverlayAppearanceRoot>
        );
    }

    const urlColor =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('color') ||
              new URLSearchParams(window.location.search).get('theme')
            : undefined;
    const bannerPalette = resolveWheelPalette(urlColor || undefined);
    const spinBannerParts =
        urlConfig.spinBanner && display.lastCheer
            ? parseSpinBannerParts(
                  urlConfig.spinBanner,
                  display.lastCheer.userName || '',
                  display.lastCheer.bits
              )
            : [];

    return (
        <OverlayAppearanceRoot>
            <div className="flex min-h-screen items-center justify-center overflow-hidden p-4">
                <div className="flex flex-col items-center gap-2">
                    <OverlayConnectionBanners
                        connected={connected}
                        stale={stale}
                        unauthorized={unauthorized}
                        retrying={retrying}
                        onRetry={retry}
                    />
                    <div
                        key={display.spinSeq || 'bits-wheel'}
                        className={`origin-center motion-reduce:animate-none ${
                            phase === 'leave'
                                ? 'motion-safe:animate-overlay-pop-out'
                                : 'motion-safe:animate-overlay-pop-in'
                        }`}
                    >
                        {spinBannerParts.length > 0 &&
                        (phase === 'enter' || phase === 'spin') &&
                        display.lastCheer ? (
                            <div
                                className="mb-3 w-[min(100%,28rem)] rounded-xl border px-4 py-2.5 text-center"
                                role="status"
                                style={{
                                    borderColor: bannerPalette.borderRgba,
                                    backgroundColor:
                                        urlConfig.cardStyle === 'solid'
                                            ? `color-mix(in srgb, ${bannerPalette.primaryHex} 38%, #0a0a0f 62%)`
                                            : bannerPalette.glowRgba
                                                  .replace('0.45', '0.14')
                                                  .replace('0.4', '0.14'),
                                    boxShadow:
                                        urlConfig.cardStyle === 'solid'
                                            ? `0 8px 24px color-mix(in srgb, ${bannerPalette.primaryHex} 26%, transparent)`
                                            : undefined
                                }}
                            >
                                <p className="text-[1.05rem] font-semibold leading-snug text-white">
                                    {spinBannerParts.map((part, i) =>
                                        part.type === 'var' ? (
                                            <span
                                                key={`${part.key}-${i}`}
                                                className="font-extrabold"
                                                style={{ color: bannerPalette.primaryHex }}
                                            >
                                                {part.value}
                                            </span>
                                        ) : (
                                            <span key={`t-${i}`}>{part.value}</span>
                                        )
                                    )}
                                </p>
                            </div>
                        ) : null}
                        <RouletteWheelDisplay
                            chatters={display.chatters}
                            wheelRotation={display.wheelRotation}
                            wheelTransition={display.wheelTransition}
                            isSpinning={display.isSpinning}
                            winner={display.winner}
                            lastSpinCount={display.lastSpinCount}
                            wheelColor={urlColor || undefined}
                            variant="overlay"
                            pointerSide="top"
                            showResultMeta={false}
                            hideLabelsWhileSpinning={false}
                            announceWinnerInChat={false}
                            centerAvatarUrl={channelAvatar}
                            winnerCardStyle={urlConfig.cardStyle}
                            winnerSubtitle={
                                urlConfig.showDonor && display.lastCheer?.userName
                                    ? aT.donorLabel.replace(
                                          '{name}',
                                          display.lastCheer.userName
                                      )
                                    : null
                            }
                        />
                    </div>
                </div>
            </div>
        </OverlayAppearanceRoot>
    );
}

function OverlayBitsRouletteApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayBitsRouletteContent session={session} />}
        </OverlaySessionGate>
    );
}

function OverlayBitsRouletteBoundary() {
    const { t } = useTranslation();
    return (
        <ErrorBoundary
            title={t.overlay.apps.bitsRouletteErrorTitle}
            retryLabel={t.common.retry}
            hint={t.common.errorBoundary.hint}
            hintDev={t.common.errorBoundary.hintDev}
        >
            <OverlayBitsRouletteApp />
        </ErrorBoundary>
    );
}

export function OverlayBitsRouletteRoot() {
    return (
        <I18nProvider>
            <OverlaySessionProvider requireAuth>
                <OverlayBitsRouletteBoundary />
            </OverlaySessionProvider>
        </I18nProvider>
    );
}
