import React from 'react';
import { Zap, CheckCircle2, Gauge, Command } from 'lucide-react';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { hoverSubtleChip } from '@/core/utils/tw';
import { AnalyticsSection } from './AnalyticsShared';

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

function RangeToggle({
    timeRange,
    setTimeRange
}: {
    timeRange: 'today' | '7d';
    setTimeRange: (val: 'today' | '7d') => void;
}) {
    return (
        <div className="flex items-center rounded-lg border border-white/[0.06] bg-bg-main p-0.5">
            <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                    timeRange === 'today'
                        ? 'bg-primary/20 text-[#a78bfa]'
                        : `text-[#8b8b93] ${hoverSubtleChip}`
                }`}
            >
                Hoy
            </button>
            <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                    timeRange === '7d'
                        ? 'bg-primary/20 text-[#a78bfa]'
                        : `text-[#8b8b93] ${hoverSubtleChip}`
                }`}
            >
                7 días
            </button>
        </div>
    );
}

function KpiTile({
    label,
    icon: Icon,
    iconClass,
    subtext,
    children
}: {
    label: string;
    icon: typeof Zap;
    iconClass: string;
    subtext: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 px-1 py-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[0.75rem] font-medium text-[#8b8b93]">{label}</span>
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md border ${iconClass}`}
                >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
            </div>
            <div className="flex flex-col">
                {children}
                <span className="mt-1 text-[0.7rem] font-medium text-zinc-400">{subtext}</span>
            </div>
        </div>
    );
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
    const subtextSuffix = timeRange === 'today' ? 'hoy' : 'en 7 días';

    return (
        <AnalyticsSection
            title="Resumen"
            info="Cambia entre Hoy y 7 días para ver el mismo conjunto de métricas en otro periodo."
            action={<RangeToggle timeRange={timeRange} setTimeRange={setTimeRange} />}
            panelClassName="min-h-[150px]"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" aria-busy={isLoading}>
                <div className="pb-5 md:pr-6 lg:pb-0">
                    <KpiTile
                        label="Peticiones"
                        icon={Zap}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={`peticiones ${subtextSuffix}`}
                    >
                        <AnimatedNumber
                            value={displayRequests}
                            duration={requestsDuration}
                            isLoading={isLoading}
                            className="text-[1.85rem] font-bold leading-none tracking-tight text-[#fafafa]"
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-white/[0.08] py-5 md:border-l md:border-t-0 md:px-6 lg:py-0">
                    <KpiTile
                        label="Tasa de éxito"
                        icon={CheckCircle2}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={`exitosas ${subtextSuffix}`}
                    >
                        <AnimatedNumber
                            value={displaySuccessRate}
                            duration={successDuration}
                            suffix="%"
                            isLoading={isLoading}
                            className="text-[1.85rem] font-bold leading-none tracking-tight text-[#fafafa]"
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-white/[0.08] py-5 md:pr-6 lg:border-l lg:border-t-0 lg:px-6 lg:py-0">
                    <KpiTile
                        label="Latencia media"
                        icon={Gauge}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={`promedio ${subtextSuffix}`}
                    >
                        <div className="flex items-end gap-1.5">
                            <AnimatedNumber
                                value={displayLatency}
                                duration={latencyDuration}
                                isLoading={isLoading}
                                className="text-[1.85rem] font-bold leading-none tracking-tight text-[#fafafa]"
                            />
                            <span className="mb-0.5 text-sm font-bold text-[#fafafa]">ms</span>
                            {!isLoading && displayLatency > 0 ? (
                                <span className="mb-1 text-xs font-medium text-[#8b8b93]">
                                    ({(displayLatency / 1000).toFixed(2)}s)
                                </span>
                            ) : null}
                        </div>
                    </KpiTile>
                </div>

                <div className="border-t border-white/[0.08] pt-5 md:border-l md:border-t-0 md:px-6 md:pt-0 lg:py-0 lg:pl-6 lg:pr-0">
                    <KpiTile
                        label="Comandos usados"
                        icon={Command}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={`distintos ${subtextSuffix}`}
                    >
                        <AnimatedNumber
                            value={displayCommands}
                            duration={1500}
                            isLoading={isLoading}
                            className="text-[1.85rem] font-bold leading-none tracking-tight text-[#fafafa]"
                        />
                    </KpiTile>
                </div>
            </div>
        </AnalyticsSection>
    );
}
