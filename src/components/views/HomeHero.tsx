import { Zap, CheckCircle2, Gauge } from 'lucide-react';
import { TwitchIcon } from '@/components/ui/icons/BrandIcons';

import { useEffect, useRef } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { animateValue } from '@/lib/animateValue';

interface HomeHeroProps {
    displayName: string;
    todayRequests: number;
    successRate: number;
    latencyMs: number;
}

const STATS_ROW =
    'flex shrink-0 gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.03] p-2 backdrop-blur-[20px] max-[1200px]:flex-wrap';

const H_STAT =
    'group relative flex min-w-[170px] cursor-default items-center gap-4 rounded-[14px] border border-white/[0.03] bg-white/[0.02] px-6 py-4 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.06] max-[1200px]:flex-1';

export function HomeHero({ displayName, todayRequests, successRate, latencyMs }: HomeHeroProps) {
    const latencyRef = useRef<HTMLSpanElement>(null);
    const prevLatencyRef = useRef<number | null>(null);

    useEffect(() => {
        const el = latencyRef.current;
        if (!el) return;
        const suffix = `ms <span class="ml-[2px] text-[0.72em] font-normal opacity-80">(${(latencyMs / 1000).toFixed(1)}s)</span>`;
        animateValue(el, prevLatencyRef.current, latencyMs, 1500, suffix);
        prevLatencyRef.current = latencyMs;
    }, [latencyMs]);

    return (
        <section className="relative mb-8 overflow-hidden rounded-[24px] border border-primary/10 bg-[radial-gradient(circle_at_20%_0%,rgba(145,70,255,0.10)_0%,transparent_45%),radial-gradient(circle_at_80%_100%,rgba(145,70,255,0.05)_0%,transparent_45%),#09090b] px-[52px] py-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_80px_rgba(145,70,255,0.05)] transition-all duration-500 hover:-translate-y-[3px] hover:border-primary/25 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_100px_rgba(145,70,255,0.08)] max-md:p-8">
            <div
                aria-hidden
                className="pointer-events-none absolute -left-[10%] -top-[20%] size-[55%] rounded-full bg-primary/12 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-1/4 -right-1/4 size-1/2 rounded-full bg-primary/6 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute top-0 -left-full z-10 h-px w-[200%] animate-border-flow bg-gradient-to-r from-transparent from-10% via-primary/15 via-40% via-primary/80 via-50% via-primary/15 via-60% to-transparent to-90% bg-size-[200%_100%]"
            />

            <div className="relative z-[5] flex items-center justify-between gap-10">
                <div className="max-w-[500px] shrink-0">
                    <h1 className="mb-3.5 text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-white max-md:text-[2rem]">
                        Hola,{' '}
                        <span className="bg-gradient-to-br from-white from-20% to-primary bg-clip-text text-transparent">
                            {displayName}
                        </span>{' '}
                        <span className="ml-3.5 align-middle text-[1.8rem] text-primary">
                            <TwitchIcon className="w-[1em] h-[1em]" aria-hidden="true" />
                        </span>
                    </h1>
                    <p className="max-w-[500px] text-[1.05rem] leading-[1.7] tracking-[0.01em] text-white/[0.55]">
                        Gestione sus utilidades de Twitch y monitoree el rendimiento de su API en tiempo real.
                    </p>
                </div>

                <div className="shrink-0">
                    <div className={STATS_ROW}>
                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-primary transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    PETICIONES (HOY)
                                </span>
                                <AnimatedNumber
                                    value={todayRequests}
                                    className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                />
                            </div>
                        </div>

                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-emerald-500 transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    ÉXITO (HOY)
                                </span>
                                <AnimatedNumber
                                    value={successRate}
                                    suffix="%"
                                    className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                />
                            </div>
                        </div>

                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-amber-500 transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <Gauge className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    LATENCIA (HOY)
                                </span>
                                <span
                                    ref={latencyRef}
                                    className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                >
                                    {latencyMs}ms
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
