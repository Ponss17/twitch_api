import { memo } from 'react';
import { Zap, CheckCircle2, Gauge } from 'lucide-react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';

interface HomeHeroProps {
    displayName: string;
    /** Suma de usos del día (comandos + herramientas + minijuegos), igual que en perfil. */
    resourceUsage: number;
    successRate: number;
    latencyMs: number;
    /** Primera carga: placeholders hasta que lleguen datos reales */
    isLoading?: boolean;
}

const STATS_ROW =
    'flex flex-1 gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.03] p-2 backdrop-blur-[20px] max-[1200px]:flex-wrap';

const H_STAT =
    'group relative flex flex-1 min-w-[180px] cursor-default items-center gap-4 rounded-[14px] border border-white/[0.03] bg-white/[0.02] px-6 py-4 transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.06]';

export const HomeHero = memo(function HomeHero({
    displayName,
    resourceUsage,
    successRate,
    latencyMs,
    isLoading = false
}: HomeHeroProps) {
    const requestsDuration = resourceUsage === 0 ? 0 : 1500;
    const successDuration = successRate === 0 ? 0 : 1500;
    const latencyDuration = latencyMs === 0 ? 0 : 1500;

    return (
        <section
            className="relative mb-8 overflow-hidden rounded-xl border border-white/[0.08] bg-bg-card px-[52px] py-10 transition-all duration-500 max-md:p-8"
            aria-busy={isLoading}
        >
            <div className="relative z-[5] flex items-center justify-between gap-10">
                <div className="max-w-[500px] shrink-0">
                    <h1 className="mb-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-white max-md:text-[2rem]">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center text-[#9146ff]">
                            <TwitchIcon className="size-full" aria-hidden />
                        </span>
                        <span>Hola,</span>
                        <span className="bg-gradient-to-br from-white from-20% to-primary bg-clip-text text-transparent">
                            {displayName}
                        </span>
                    </h1>
                    <p className="max-w-[500px] text-[1.05rem] leading-[1.7] tracking-[0.01em] text-white/[0.55]">
                        Gestione sus utilidades de Twitch y monitoree el rendimiento de su API en tiempo real.
                    </p>
                </div>

                <div className="flex-1 min-w-0">
                    <div className={STATS_ROW}>
                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-primary transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 flex-col gap-0.5 text-left justify-center">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    Recursos (hoy)
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <AnimatedNumber
                                        value={resourceUsage}
                                        duration={requestsDuration}
                                        isLoading={isLoading}
                                        className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-emerald-500 transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 flex-col gap-0.5 text-left justify-center">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    ÉXITO (HOY)
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <AnimatedNumber
                                        value={successRate}
                                        duration={successDuration}
                                        suffix="%"
                                        isLoading={isLoading}
                                        className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={H_STAT}>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] bg-black/30 text-[1.2rem] text-amber-500 transition-all group-hover:scale-110 group-hover:-rotate-[8deg] group-hover:border-primary/30">
                                <Gauge className="w-4 h-4" />
                            </div>
                            <div className="flex min-w-0 flex-col gap-0.5 text-left justify-center">
                                <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/40">
                                    LATENCIA MEDIA
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                    <AnimatedNumber
                                        value={latencyMs}
                                        duration={latencyDuration}
                                        suffix="ms"
                                        isLoading={isLoading}
                                        className="text-2xl font-extrabold leading-none tracking-tight text-white"
                                    />
                                    {!isLoading && latencyMs > 0 ? (
                                        <span className="text-[0.72em] font-normal leading-none tracking-tight text-white/50">
                                            ({(latencyMs / 1000).toFixed(1)}s)
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});
