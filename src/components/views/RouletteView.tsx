import { Crown, Dices, Loader2, MessageSquare, Pause, Play, RotateCw, Sparkles, Users } from 'lucide-react';

import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS } from '@/lib/config';
import { authHeaders } from '@/lib/auth';
import { buildAuthQueryParam } from '@/lib/authQuery';
import { useRequiredSession } from '@/hooks/useSession';
import { useTmiChat } from '@/hooks/useTmiChat';
import { tmiService } from '@/lib/tmiService';
import type { RouletteUser } from '@/lib/twitchTypes';
import { card, fadeIn } from '@/lib/tw';
import { readScopedPref, writeScopedPref } from '@/lib/localPrefs';
import {
    DEFAULT_ELIGIBILITY_FILTERS,
    filtersToApiParam,
    hasAnyFilter,
    isAllFilters,
    rolesFromTags,
    tagsMatchFilters,
    userMatchesFilters,
    type RouletteEligibilityFilters
} from '@/lib/rouletteEligibility';
import { RouletteEligibilityDropdown } from '@/components/views/RouletteEligibilityDropdown';
import { useToast } from '@/components/ui/ToastProvider';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import confetti from 'canvas-confetti';

/** Paleta morada/violeta alineada al brand; alterna tonos para distinguir segmentos */
const WHEEL_HUES = [272, 258, 286, 248, 278, 264, 282, 252] as const;

function segmentColors(index: number): { inner: string; outer: string; divider: string } {
    const hue = WHEEL_HUES[index % WHEEL_HUES.length];
    const even = index % 2 === 0;
    return {
        inner: even ? `hsl(${hue} 52% 46%)` : `hsl(${hue} 48% 38%)`,
        outer: even ? `hsl(${hue} 55% 30%)` : `hsl(${hue} 50% 24%)`,
        divider: 'rgba(255,255,255,0.14)'
    };
}

function WheelPointer() {
    return (
        <svg
            width="28"
            height="34"
            viewBox="0 0 28 34"
            className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]"
            aria-hidden
        >
            <path
                d="M14 2 L25 30 Q14 26 3 30 Z"
                fill="#fafafa"
                stroke="rgba(145,70,255,0.45)"
                strokeWidth="1"
            />
            <circle cx="14" cy="7" r="3.5" fill="#9146ff" />
        </svg>
    );
}

const LISTENER_ID = 'roulette';
const ANNOUNCE_WINNER_PREF = 'roulette_announce_winner';
const LEGACY_ANNOUNCE_WINNER_KEY = 'roulette_announce_winner_in_chat';

function readAnnounceWinnerPref(userId: string): boolean {
    const stored = readScopedPref(ANNOUNCE_WINNER_PREF, userId, LEGACY_ANNOUNCE_WINNER_KEY);
    return stored === null ? true : stored === '1';
}

function writeAnnounceWinnerPref(userId: string, enabled: boolean): void {
    writeScopedPref(ANNOUNCE_WINNER_PREF, userId, enabled ? '1' : '0', LEGACY_ANNOUNCE_WINNER_KEY);
}

function truncateLabel(name: string, max = 12): string {
    return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function normalizeDegrees(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

function winnerIndex(rotationDeg: number, participantCount: number): number {
    if (participantCount <= 1) return 0;
    const arcDeg = 360 / participantCount;
    const degrees = normalizeDegrees(rotationDeg);
    const index = Math.floor(((360 - ((degrees + 90) % 360)) % 360) / arcDeg);
    return index % participantCount;
}

export function RouletteView({ active = true }: { active?: boolean }) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
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
    const isOpenRef = useRef(isOpen);
    const isSpinningRef = useRef(isSpinning);
    const filtersRef = useRef(filters);
    isOpenRef.current = isOpen;
    isSpinningRef.current = isSpinning;
    filtersRef.current = filters;

    const pulseCounter = useCallback(() => {
        setCountPulse(true);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setCountPulse(false), 500);
    }, []);

    const drawEmptyWheel = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const cx = w / 2;
        const cy = h / 2;
        const outsideRadius = 200;
        const insideRadius = 52;

        ctx.clearRect(0, 0, w, h);

        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#0a0810';
        ctx.fill();

        const emptyGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
        emptyGrad.addColorStop(0, 'hsl(272 45% 22%)');
        emptyGrad.addColorStop(1, 'hsl(268 40% 14%)');

        ctx.fillStyle = emptyGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(145, 70, 255, 0.45)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(145, 70, 255, 0.35)';
        ctx.stroke();
    }, []);

    const drawWheel = useCallback(
        (users: RouletteUser[], options: { labels?: boolean } = {}) => {
            const showLabels = options.labels !== false;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = canvas.width;
            const h = canvas.height;
            const cx = w / 2;
            const cy = h / 2;
            const outsideRadius = 200;
            const textRadius = 148;
            const insideRadius = 52;
            const len = users.length;

            ctx.clearRect(0, 0, w, h);
            if (len === 0) {
                drawEmptyWheel(ctx, w, h);
                return;
            }

            ctx.beginPath();
            ctx.arc(cx, cy, outsideRadius + 12, 0, 2 * Math.PI);
            ctx.fillStyle = '#07050c';
            ctx.fill();

            if (len === 1) {
                const ringGrad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
                ringGrad.addColorStop(0, 'hsl(272 58% 52%)');
                ringGrad.addColorStop(1, 'hsl(268 55% 32%)');

                ctx.fillStyle = ringGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
                ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI, true);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(cx, cy, outsideRadius, 0, 2 * Math.PI);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                ctx.stroke();
            } else {
                const segments = len;
                const arc = (Math.PI * 2) / segments;

                for (let i = 0; i < segments; i++) {
                    const angle = i * arc;
                    const { inner, outer, divider } = segmentColors(i);
                    const participant = users[i];

                    const grad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
                    grad.addColorStop(0, inner);
                    grad.addColorStop(1, outer);

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, outsideRadius, angle, angle + arc, false);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * insideRadius, cy + Math.sin(angle) * insideRadius);
                    ctx.lineTo(cx + Math.cos(angle) * outsideRadius, cy + Math.sin(angle) * outsideRadius);
                    ctx.strokeStyle = divider;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    if (showLabels) {
                        ctx.save();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `bold ${segments > 16 ? 10 : segments > 10 ? 11 : 13}px Inter, system-ui, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(0,0,0,0.85)';
                        ctx.shadowBlur = 4;
                        const labelAngle = angle + arc / 2;
                        ctx.translate(
                            cx + Math.cos(labelAngle) * textRadius,
                            cy + Math.sin(labelAngle) * textRadius
                        );
                        ctx.rotate(labelAngle + Math.PI / 2);
                        ctx.fillText(truncateLabel(participant.user_name, segments > 12 ? 8 : 12), 0, 0);
                        ctx.restore();
                    }
                }
            }

            ctx.beginPath();
            ctx.arc(cx, cy, insideRadius, 0, 2 * Math.PI);
            ctx.fillStyle = '#18181b';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(145, 70, 255, 0.65)';
            ctx.stroke();
        },
        [drawEmptyWheel]
    );

    useEffect(() => {
        drawWheel(chatters, { labels: !isSpinningRef.current });
    }, [chatters, drawWheel]);

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

    const toggleOpen = async () => {
        if (isOpen) {
            setIsOpen(false);
            showToast('Inscripciones Cerradas', 'info');
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
        await loadChatters();
    };

    const sendWinnerMessage = (winMsg: string) => {
        if (tmiService.isConnected && tmiService.client) {
            void tmiService.say(session.login!, winMsg).catch(() => sendViaApi(winMsg));
        } else {
            sendViaApi(winMsg);
        }
    };

    const sendViaApi = (message: string) => {
        const { apiKey, token } = session;
        const authParam = buildAuthQueryParam({ apiKey, token });
        if (!authParam) return;

        void fetch(`${API_ENDPOINTS.SEND_MESSAGE}?${authParam}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ message })
        }).catch(() => showToast('No se pudo enviar el resultado al chat', 'error'));
    };

    const spin = () => {
        if (isSpinning || chatters.length === 0) return;

        const participants = [...chatters];
        setIsSpinning(true);
        setWinner(null);
        drawWheel(participants, { labels: false });

        const extraTurns = 5 + Math.random() * 4;
        const totalDelta = 360 * extraTurns + Math.random() * 360;
        const duration = 4200 + Math.random() * 2800;
        const targetRotation = wheelRotation + totalDelta;

        spinMetaRef.current = { targetRotation, participants };

        const prefersReducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setWheelRotation(targetRotation);
            setWheelTransition('none');
            finishSpin(targetRotation, participants);
            return;
        }

        setWheelTransition('none');
        requestAnimationFrame(() => {
            setWheelTransition(`transform ${Math.round(duration)}ms cubic-bezier(0.15, 0.85, 0.25, 1)`);
            setWheelRotation(targetRotation);
        });
    };

    const finishSpin = (finalRotation: number, participants: RouletteUser[]) => {
        setWheelTransition('none');
        setIsSpinning(false);
        drawWheel(participants, { labels: true });

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
    };

    const onWheelTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
        if (e.propertyName !== 'transform') return;
        const meta = spinMetaRef.current;
        if (!meta || !isSpinningRef.current) return;
        spinMetaRef.current = null;
        finishSpin(meta.targetRotation, meta.participants);
    };

    useEffect(() => {
        if (!session.userId) return;
        setAnnounceWinnerInChat(readAnnounceWinnerPref(session.userId));
    }, [session.userId]);

    useEffect(() => {
        setChatters((prev) => prev.filter((u) => userMatchesFilters(u, filters)));
        if (isOpen) void loadChatters();
    }, [filters, isOpen, loadChatters]);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [chatters]);

    useEffect(() => {
        if (active) return;
        setIsOpen(false);
    }, [active]);

    useEffect(() => {
        return () => {
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        };
    }, []);

    return (
        <div className={`${card} ${fadeIn} mb-3`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-2 max-md:flex-col max-md:items-start">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Dices className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Ruleta de Viewers</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">Sortea premios entre los usuarios activos</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 max-md:w-full">
                    <RouletteEligibilityDropdown
                        filters={filters}
                        disabled={isSpinning}
                        onChange={setFilters}
                    />

                    <button
                        type="button"
                        onClick={() => {
                            if (!session.userId) return;
                            setAnnounceWinnerInChat((prev) => {
                                const next = !prev;
                                writeAnnounceWinnerPref(session.userId!, next);
                                showToast(
                                    next ? 'Ganador visible en chat' : 'Ganador solo en panel',
                                    'info'
                                );
                                return next;
                            });
                        }}
                        disabled={isSpinning}
                        title={
                            announceWinnerInChat
                                ? 'Anunciar ganador en chat (activado)'
                                : 'No anunciar ganador en chat (desactivado)'
                        }
                        aria-pressed={announceWinnerInChat}
                        aria-label={
                            announceWinnerInChat
                                ? 'Anunciar ganador en chat, activado'
                                : 'Anunciar ganador en chat, desactivado'
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.75rem] font-semibold transition hover:bg-white/5 disabled:opacity-50 ${
                            announceWinnerInChat
                                ? 'border-primary/35 bg-primary/10 text-primary'
                                : 'border-white/10 bg-white/[0.03] text-[#71717a]'
                        }`}
                    >
                        <MessageSquare className="size-3.5 shrink-0" aria-hidden />
                        En chat
                    </button>

                    <span
                        className={`inline-block rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-[0.6875rem] font-bold tracking-wide text-[#a78bfa] transition ${
                            countPulse ? 'scale-110 text-[#3b82f6]' : ''
                        }`}
                    >
                        {chatters.length}
                    </span>

                    <button
                        type="button"
                        onClick={() => void toggleOpen()}
                        title={isOpen ? 'Pausar inscripciones' : 'Abrir inscripciones'}
                        aria-label={isOpen ? 'Pausar inscripciones' : 'Abrir inscripciones'}
                        className={`rounded-lg border-none px-3 py-1 text-[0.8125rem] transition hover:bg-white/5 ${
                            isOpen ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'
                        }`}
                    >
                        {isOpen ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            void loadChatters();
                            showToast('Lista actualizada', 'success');
                        }}
                        title="Recargar usuarios"
                        aria-label="Recargar usuarios"
                        className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-[#c4c4cc] transition hover:bg-white/5 hover:text-[#fafafa]"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>

                    <InfoTooltip text="Sorteo en vivo. Elige quién puede participar y si el ganador se anuncia en el chat de Twitch (botón Chat)." />
                </div>
            </div>

            <div className="text-center text-[#fafafa]">
                <div className="relative mx-auto aspect-square max-w-[380px] p-5 max-[480px]:max-w-full max-[480px]:p-2.5">
                    <div
                        className={`absolute inset-5 rounded-full transition-shadow duration-300 max-[480px]:inset-2.5 ${
                            isSpinning
                                ? 'shadow-[0_0_60px_rgba(145,70,255,0.55)]'
                                : 'shadow-[0_0_40px_rgba(145,70,255,0.25)]'
                        }`}
                        aria-hidden
                    />

                    <div
                        className={`relative h-full w-full origin-center will-change-transform ${
                            isSpinning ? 'motion-safe:brightness-110' : ''
                        }`}
                        style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: wheelTransition
                        }}
                        onTransitionEnd={onWheelTransitionEnd}
                    >
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={500}
                            className="h-full w-full rounded-full"
                        />
                    </div>

                    <div
                        className="pointer-events-none absolute top-1 left-1/2 z-20 -translate-x-1/2"
                        aria-hidden
                    >
                        <WheelPointer />
                    </div>

                    <div
                        className="pointer-events-none absolute top-1/2 left-1/2 z-10 flex h-[14%] w-[14%] min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-primary/70 bg-[#18181b] shadow-[0_0_20px_rgba(0,0,0,0.6),inset_0_0_12px_rgba(145,70,255,0.15)]"
                        aria-hidden
                    >
                        {chatters.length === 0 ? (
                            <Users className="w-5 h-5 text-[#71717a]" aria-hidden="true" />
                        ) : (
                            <Dices className={`w-5 h-5 text-primary ${isSpinning ? 'animate-pulse' : ''}`} aria-hidden="true" />
                        )}
                    </div>

                    {chatters.length === 0 && (
                        <div
                            className="pointer-events-none absolute top-[65%] left-1/2 z-[5] w-[52%] -translate-x-1/2 -translate-y-1/2 text-center"
                            aria-hidden
                        >
                            <p className="text-[0.8125rem] font-semibold leading-snug text-[#c4c4cc]">
                                Sin participantes
                            </p>
                            <p className="mt-1 text-[0.6875rem] leading-snug text-[#52525b]">
                                Pulsa ▶ para abrir inscripciones
                            </p>
                        </div>
                    )}

                    {chatters.length === 1 && !isSpinning && (
                        <div
                            className="pointer-events-none absolute top-[15%] left-1/2 z-15 w-[62%] -translate-x-1/2"
                            aria-hidden
                        >
                            <span className="block rounded-lg bg-black/55 px-3 py-1.5 text-center text-[0.875rem] font-bold leading-tight text-white shadow-[0_2px_10px_rgba(0,0,0,0.45)] backdrop-blur-sm">
                                {chatters[0].user_name}
                            </span>
                        </div>
                    )}

                    {isSpinning && (
                        <div
                            className="pointer-events-none absolute inset-5 flex items-end justify-center pb-3 max-[480px]:inset-2.5"
                            aria-live="polite"
                        >
                            <span className="rounded-full bg-black/50 px-3 py-1 text-[0.6875rem] font-semibold tracking-wide text-[#e4e4e7] uppercase backdrop-blur-sm">
                                Girando…
                            </span>
                        </div>
                    )}

                    {winner && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-[4px]">
                            <div className="animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards] rounded-2xl border border-primary/40 bg-bg-secondary px-8 py-6 text-center opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_32px_rgba(145,70,255,0.15)] max-[480px]:px-6">
                                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
                                    <Crown className="size-6 text-amber-400" aria-hidden />
                                </div>
                                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#c4c4cc]">
                                    Ganador
                                </p>
                                <p className="mb-1 text-[1.6rem] font-extrabold leading-tight text-primary">
                                    {winner.user_name}
                                </p>
                                <p className="mb-4 flex items-center justify-center gap-1.5 text-[0.85rem] text-[#c4c4cc]">
                                    <Sparkles className="size-3.5 text-primary" aria-hidden />
                                    {lastSpinCount || chatters.length} participantes
                                </p>
                                {!announceWinnerInChat ? (
                                    <p className="mb-3 text-[0.75rem] text-[#71717a]">
                                        No anunciado en chat (opción desactivada)
                                    </p>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setWinner(null)}
                                    className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 py-2 text-[0.8125rem] font-semibold text-[#fafafa] transition hover:border-white/30 hover:bg-white/15"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-5">
                    <button
                        type="button"
                        onClick={spin}
                        disabled={isSpinning || chatters.length === 0}
                        className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-primary-hover px-10 py-3.5 text-[1rem] font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_15px_30px_rgba(168,85,247,0.4)] active:translate-y-px disabled:opacity-50 disabled:hover:scale-100 max-[480px]:w-full max-[480px]:justify-center max-[480px]:px-8 max-[480px]:py-3 max-[480px]:text-[0.9375rem]"
                    >
                        {isSpinning ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4" />}
                        {isSpinning ? 'Girando...' : 'GIRAR RULETA'}
                    </button>
                </div>

                <p className="mt-2.5 text-[0.6875rem] italic opacity-60">
                    * Twitch tarda unos minutos en actualizar la lista
                </p>

                {(isOpen || chatters.length > 0) && (
                    <div className="mt-4 text-left">
                        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-[#71717a]">
                            Participantes ({chatters.length})
                        </p>
                        <ul
                            ref={listRef}
                            className="max-h-[200px] overflow-y-auto overflow-x-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-1"
                        >
                            {chatters.length === 0 ? (
                                <li className="px-3 py-4 text-center text-[0.75rem] text-[#52525b]">
                                    Esperando mensajes en el chat…
                                </li>
                            ) : (
                                chatters.map((u) => (
                                    <li
                                        key={u.user_login}
                                        className="flex items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-[0.8rem] last:border-0"
                                    >
                                        <span className="truncate font-semibold text-[#fafafa]">
                                            {u.user_name}
                                        </span>
                                        <span className="ml-auto flex shrink-0 gap-1">
                                            {u.sub && (
                                                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-primary">
                                                    SUB
                                                </span>
                                            )}
                                            {u.mod && (
                                                <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-green-400">
                                                    MOD
                                                </span>
                                            )}
                                            {u.vip && (
                                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-400">
                                                    VIP
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
