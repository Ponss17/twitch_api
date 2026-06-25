import { Dices, Pause, RotateCw, Loader2, Play, Users, UserCheck } from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS, IGNORED_BOTS } from '@/lib/config';
import { authHeaders } from '@/lib/auth';
import { buildAuthQueryParam } from '@/lib/authQuery';
import { useRequiredSession } from '@/hooks/useSession';
import { getTmiAuth, tmiService } from '@/lib/tmiService';
import type { RouletteUser } from '@/lib/twitchTypes';
import { card, fadeIn, selectInput } from '@/lib/tw';
import {
    ROULETTE_ELIGIBILITY_OPTIONS,
    rolesForEligibility,
    rolesFromTags,
    tagsMatchEligibility,
    userMatchesEligibility,
    type RouletteEligibility
} from '@/lib/rouletteEligibility';
import { useToast } from '@/components/ui/ToastProvider';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import confetti from 'canvas-confetti';

const COLORS = ['#9146ff', '#772ce8', '#3b82f6', '#06b6d4', '#10b981', '#eab308', '#f97316', '#ef4444'];
const LISTENER_ID = 'roulette';

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
    const wheelWrapRef = useRef<HTMLDivElement>(null);
    const rotationDegRef = useRef(0);
    const [chatters, setChatters] = useState<RouletteUser[]>([]);
    const [eligibility, setEligibility] = useState<RouletteEligibility>('all');
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<RouletteUser | null>(null);
    const [countPulse, setCountPulse] = useState(false);
    const spinRef = useRef<number | null>(null);
    const pulseTimerRef = useRef<number | null>(null);
    const [lastSpinCount, setLastSpinCount] = useState(0);
    const isOpenRef = useRef(isOpen);
    const isSpinningRef = useRef(isSpinning);
    const eligibilityRef = useRef(eligibility);
    isOpenRef.current = isOpen;
    isSpinningRef.current = isSpinning;
    eligibilityRef.current = eligibility;

    const applyRotation = useCallback((deg: number) => {
        rotationDegRef.current = deg;
        if (wheelWrapRef.current) {
            wheelWrapRef.current.style.transform = `rotate(${deg}deg)`;
        }
    }, []);

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
        ctx.fillStyle = '#0c0a12';
        ctx.fill();

        const grad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
        grad.addColorStop(0, '#1a1625');
        grad.addColorStop(1, '#14101f');

        ctx.fillStyle = grad;
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
            ctx.fillStyle = '#08060d';
            ctx.fill();

            if (len === 1) {
                const baseColor = COLORS[0];
                const grad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
                grad.addColorStop(0, baseColor);
                grad.addColorStop(1, baseColor + 'cc');

                ctx.fillStyle = grad;
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
                    const baseColor = COLORS[i % COLORS.length];
                    const participant = users[i];

                    const grad = ctx.createRadialGradient(cx, cy, insideRadius, cx, cy, outsideRadius);
                    grad.addColorStop(0, baseColor);
                    grad.addColorStop(1, baseColor + 'cc');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, outsideRadius, angle, angle + arc, false);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(angle) * insideRadius, cy + Math.sin(angle) * insideRadius);
                    ctx.lineTo(cx + Math.cos(angle) * outsideRadius, cy + Math.sin(angle) * outsideRadius);
                    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
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

        if (eligibilityRef.current === 'all') {
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
                    eligibility: eligibilityRef.current
                });
                const res = await fetch(`${API_ENDPOINTS.CHATTERS}?${params}`, {
                headers: authHeaders(session)
            });
            if (!res.ok) {
                if (eligibilityRef.current !== 'all') {
                    showToast(
                        'No se pudo filtrar participantes. Vuelve a iniciar sesión con Twitch si el filtro es nuevo.',
                        'error'
                    );
                }
                return;
            }
            const data = await res.json();
            const list: (string | RouletteUser)[] = Array.isArray(data) ? data : data.chatters ?? [];
            const roleDefaults = rolesForEligibility(eligibilityRef.current);

            setChatters((prev) => {
                const existing = new Set(prev.map((u) => u.user_login.toLowerCase()));
                const next = [...prev];
                let added = 0;
                list.forEach((item) => {
                    const login = typeof item === 'string' ? item : item.user_login;
                    const name = typeof item === 'string' ? item : item.user_name;
                    if (!login) return;
                    const lower = login.toLowerCase();
                    if (!existing.has(lower) && !IGNORED_BOTS.has(lower)) {
                        next.push({
                            user_login: login,
                            user_name: name || login,
                            ...roleDefaults
                        });
                        existing.add(lower);
                        added++;
                    }
                });
                if (added > 0) pulseCounter();
                return next.filter((u) => userMatchesEligibility(u, eligibilityRef.current));
            });
        } catch {
            showToast('Error al cargar usuarios del chat', 'error');
        }
    }, [session, showToast, pulseCounter]);

    const connectTmi = useCallback(async () => {
        if (!session.login) return;
        try {
            await tmiService.connect(session.login, getTmiAuth(session));
            tmiService.addListener(LISTENER_ID, (_ch, tags) => {
                if (isSpinningRef.current || !isOpenRef.current) return;
                if (!tagsMatchEligibility(tags, eligibilityRef.current)) return;
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
            });
        } catch {
            showToast('Error al conectar con el chat', 'error');
            setIsOpen(false);
        }
    }, [session, showToast, pulseCounter]);

    const toggleOpen = async () => {
        if (isOpen) {
            tmiService.removeListener(LISTENER_ID);
            tmiService.disconnect();
            setIsOpen(false);
            showToast('Inscripciones Cerradas', 'info');
            return;
        }
        setIsOpen(true);
        setChatters([]);
        setWinner(null);
        setLastSpinCount(0);
        showToast('Inscripciones Abiertas', 'success');
        await loadChatters();
        await connectTmi();
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

        const startRotation = rotationDegRef.current;
        const extraTurns = 5 + Math.random() * 4;
        const totalDelta = 360 * extraTurns + Math.random() * 360;
        const duration = 4200 + Math.random() * 2800;
        let startTime: number | null = null;

        const finishSpin = (finalRotation: number) => {
            applyRotation(finalRotation);
            setIsSpinning(false);
            drawWheel(participants, { labels: true });

            const index = winnerIndex(finalRotation, participants.length);
            const picked = participants[index];
            setWinner(picked);

            const count = participants.length;
            setLastSpinCount(count);
            showToast(`Ganador: @${picked.user_name} (${count})`, 'success');
            sendWinnerMessage(
                `🏆 ¡El ganador es @${picked.user_name}! (De ${count} participantes) ¡Felicidades! 🎉`
            );
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#9146ff', '#f59e0b', '#10b981', '#ec4899', '#3b82f6']
            });
        };

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            if (elapsed >= duration) {
                if (spinRef.current) cancelAnimationFrame(spinRef.current);
                finishSpin(startRotation + totalDelta);
                return;
            }

            const t = elapsed / duration;
            const eased = 1 - Math.pow(1 - t, 4);
            applyRotation(startRotation + totalDelta * eased);
            spinRef.current = requestAnimationFrame(animate);
        };

        spinRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        setChatters((prev) => prev.filter((u) => userMatchesEligibility(u, eligibility)));
        if (isOpen) void loadChatters();
    }, [eligibility, isOpen, loadChatters]);

    useEffect(() => {
        if (active) return;
        if (spinRef.current) cancelAnimationFrame(spinRef.current);
        tmiService.removeListener(LISTENER_ID);
        tmiService.disconnect();
        setIsOpen(false);
    }, [active]);

    useEffect(() => {
        return () => {
            if (spinRef.current) cancelAnimationFrame(spinRef.current);
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
            tmiService.removeListener(LISTENER_ID);
            tmiService.disconnect();
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
                        <p className="text-[0.8rem] text-[#a1a1aa]">Sortea premios entre los usuarios activos</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 max-md:w-full">
                    <label className="flex items-center gap-2 text-[0.75rem] font-semibold text-[#a1a1aa]">
                        <UserCheck className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="sr-only">Elegibilidad</span>
                        <select
                            value={eligibility}
                            onChange={(e) => setEligibility(e.target.value as RouletteEligibility)}
                            disabled={isSpinning}
                            className={`${selectInput} min-w-[140px] max-w-[180px] py-1.5`}
                            aria-label="Quién puede participar"
                        >
                            {ROULETTE_ELIGIBILITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>

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
                        className="rounded-lg border-none px-3 py-1 text-[0.8125rem] text-[#a1a1aa] transition hover:bg-white/5 hover:text-[#fafafa]"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>

                    <InfoTooltip text="Sorteo en vivo. Al abrir inscripciones, entran quienes hablan en chat y cumplen el filtro elegido (subs, mods, VIPs o todos)." />
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
                        ref={wheelWrapRef}
                        className={`relative h-full w-full origin-center will-change-transform ${
                            isSpinning ? 'motion-safe:brightness-110' : ''
                        }`}
                        style={{ transform: `rotate(${rotationDegRef.current}deg)` }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={500}
                            height={500}
                            className="h-full w-full rounded-full"
                        />
                    </div>

                    <div
                        className="pointer-events-none absolute top-2.5 left-1/2 z-20 -translate-x-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
                        aria-hidden
                    >
                        <div className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-[#fafafa]" />
                        <div className="mx-auto -mt-px h-1.5 w-1.5 rounded-full bg-[#fafafa]" />
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
                            <p className="text-[0.8125rem] font-semibold leading-snug text-[#a1a1aa]">
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
                            <div className="animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards] rounded-2xl border-2 border-primary bg-bg-secondary px-10 py-5 text-center opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                                <div
                                    className="mb-2.5 text-[1.8rem] font-extrabold text-[#fafafa]"
                                    style={{ textShadow: '0 0 20px rgba(145, 70, 255, 0.8)' }}
                                >
                                    👑 Ganador:{' '}
                                    <strong className="text-primary">{winner.user_name}</strong>{' '}
                                    <span className="text-[0.9em] opacity-80">({lastSpinCount || chatters.length})</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setWinner(null)}
                                    className="mt-2.5 inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 py-2 text-[0.8125rem] font-semibold text-[#fafafa] transition hover:border-white/30 hover:bg-white/15"
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
            </div>
        </div>
    );
}
