import React from 'react';
import { BarChart3, Zap, CheckCircle2, Gauge, Command } from 'lucide-react';
import { CardHeaderIcon } from '@/shared/ui/Icon';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';

const STATS_ROW = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';

const H_STAT =
    'group relative flex flex-col gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-6 py-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-white/[0.04] hover:shadow-2xl';

interface AnalyticsKPIsProps {
    timeRange: 'today' | '7d';
    setTimeRange: (val: 'today' | '7d') => void;
    isLoading: boolean;
    displayRequests: number;
    displaySuccessRate: number;
    displayLatency: number;
    displayCommands: number;
    requestsDuration: number;
    successDuration: number;
    latencyDuration: number;
}

export function AnalyticsKPIs({
    timeRange,
    setTimeRange,
    isLoading,
    displayRequests,
    displaySuccessRate,
    displayLatency,
    displayCommands,
    requestsDuration,
    successDuration,
    latencyDuration
}: AnalyticsKPIsProps) {
    const subtextSuffix = timeRange === 'today' ? 'hoy' : 'en los últimos 7 días';

    return (
        <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
            <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                    <CardHeaderIcon icon={BarChart3} />
                    <div>
                        <h3 className="mb-0.5 text-[1.05rem] font-bold text-[#fafafa]">Analytics Overview</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            KPIs generales {timeRange === 'today' ? 'del día actual' : 'de los últimos 7 días'} en tiempo real.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/[0.05]">
                        <button
                            onClick={() => setTimeRange('today')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === 'today' ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => setTimeRange('7d')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === '7d' ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            7 Días
                        </button>
                    </div>
                    <InfoTooltip text="Métricas generales en tiempo real. Alterna entre los datos de hoy y los últimos 7 días." />
                </div>
            </div>

            <div className={STATS_ROW} aria-busy={isLoading}>
                {/* Total Requests */}
                <div className={H_STAT}>
                    <div className="flex justify-between items-center w-full mb-2">
                        <span className="text-sm font-medium text-zinc-300">Peticiones Totales</span>
                        <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <AnimatedNumber
                            value={displayRequests}
                            duration={requestsDuration}
                            isLoading={isLoading}
                            className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                        />
                        <span className="text-xs text-zinc-500 mt-2 font-medium">peticiones realizadas {subtextSuffix}</span>
                    </div>
                </div>

                {/* Success Rate */}
                <div className={H_STAT}>
                    <div className="flex justify-between items-center w-full mb-2">
                        <span className="text-sm font-medium text-zinc-300">Tasa de Éxito</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                        <AnimatedNumber
                            value={displaySuccessRate}
                            duration={successDuration}
                            suffix="%"
                            isLoading={isLoading}
                            className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                        />
                        <span className="text-xs text-zinc-500 mt-2 font-medium">peticiones exitosas {subtextSuffix}</span>
                    </div>
                </div>

                {/* Avg Processing Time */}
                <div className={H_STAT}>
                    <div className="flex justify-between items-center w-full mb-2">
                        <span className="text-sm font-medium text-zinc-300">Tiempo de Proceso Medio</span>
                        <Gauge className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-end gap-1.5">
                            <AnimatedNumber
                                value={displayLatency}
                                duration={latencyDuration}
                                isLoading={isLoading}
                                className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                            />
                            <span className="text-xl font-bold text-white mb-0.5">ms</span>
                            {!isLoading && displayLatency > 0 && (
                                <span className="mb-1 text-sm font-medium text-zinc-500">
                                    ({(displayLatency / 1000).toFixed(2)}s)
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-zinc-500 mt-2 font-medium">latencia promedio de tus comandos {subtextSuffix}</span>
                    </div>
                </div>

                {/* Commands */}
                <div className={H_STAT}>
                    <div className="flex justify-between items-center w-full mb-2">
                        <span className="text-sm font-medium text-zinc-300">Comandos Usados</span>
                        <Command className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <AnimatedNumber
                            value={displayCommands}
                            duration={1500}
                            isLoading={isLoading}
                            className="text-[2.5rem] font-bold leading-none tracking-tight text-white"
                        />
                        <span className="text-xs text-zinc-500 mt-2 font-medium">herramientas diferentes invocadas {subtextSuffix}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
