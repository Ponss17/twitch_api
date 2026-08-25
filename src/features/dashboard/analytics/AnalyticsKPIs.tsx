import React from 'react';
import { Zap, CheckCircle2, Gauge, Command } from 'lucide-react';
import { AnimatedNumber } from '@/shared/ui/AnimatedNumber';
import { hoverSubtleChip } from '@/core/utils/tw';
import { AnalyticsSection } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Translations } from '@/core/i18n/locales/es';

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
    setTimeRange,
    t
}: {
    timeRange: 'today' | '7d';
    setTimeRange: (val: 'today' | '7d') => void;
    t: Translations;
}) {
    return (
        <div
            className="relative grid grid-cols-2 rounded-lg border border-border-subtle bg-bg-main p-0.5"
            role="group"
            aria-label={t.analytics.rangeGroup}
        >
            <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-primary/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    timeRange === '7d' ? 'translate-x-full' : 'translate-x-0'
                }`}
            />
            <button
                type="button"
                onClick={() => setTimeRange('today')}
                aria-pressed={timeRange === 'today'}
                className={`relative z-10 rounded-md px-3 py-1 text-xs transition-colors duration-300 ${
                    timeRange === 'today'
                        ? 'font-semibold text-brand-text'
                        : `font-medium text-text-muted ${hoverSubtleChip}`
                }`}
            >
                {t.analytics.kpis.today}
            </button>
            <button
                type="button"
                onClick={() => setTimeRange('7d')}
                aria-pressed={timeRange === '7d'}
                className={`relative z-10 rounded-md px-3 py-1 text-xs transition-colors duration-300 ${
                    timeRange === '7d'
                        ? 'font-semibold text-brand-text'
                        : `font-medium text-text-muted ${hoverSubtleChip}`
                }`}
            >
                {t.analytics.kpis.sevenDays}
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
        <div className="flex flex-col gap-1 px-1 py-0.5">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[0.7rem] font-medium text-text-muted">{label}</span>
                <div
                    className={`flex size-6 items-center justify-center rounded-md border ${iconClass}`}
                >
                    <Icon className="size-3" aria-hidden="true" />
                </div>
            </div>
            <div className="flex flex-col">
                {children}
                <span className="mt-0.5 text-[0.65rem] font-medium text-text-muted">{subtext}</span>
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
    const { t } = useTranslation();
    const kpis = t.analytics.kpis;
    const valueClass =
        'text-[1.5rem] font-bold leading-none tracking-tight text-text-main';

    return (
        <AnalyticsSection
            title={kpis.title}
            info={kpis.info}
            action={<RangeToggle timeRange={timeRange} setTimeRange={setTimeRange} t={t} />}
            panelClassName="shrink-0"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" aria-busy={isLoading}>
                <div className="pb-3 md:pr-5 lg:pb-0">
                    <KpiTile
                        label={kpis.requests}
                        icon={Zap}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={timeRange === 'today' ? kpis.requestsToday : kpis.requests7d}
                    >
                        <AnimatedNumber
                            value={displayRequests}
                            duration={requestsDuration}
                            isLoading={isLoading}
                            className={valueClass}
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong py-3 md:border-l md:border-t-0 md:px-5 lg:py-0">
                    <KpiTile
                        label={kpis.successRate}
                        icon={CheckCircle2}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={timeRange === 'today' ? kpis.successToday : kpis.success7d}
                    >
                        <AnimatedNumber
                            value={displaySuccessRate}
                            duration={successDuration}
                            suffix="%"
                            isLoading={isLoading}
                            className={valueClass}
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong py-3 md:pr-5 lg:border-l lg:border-t-0 lg:px-5 lg:py-0">
                    <KpiTile
                        label={kpis.latency}
                        icon={Gauge}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={timeRange === 'today' ? kpis.latencyToday : kpis.latency7d}
                    >
                        <div className="flex items-end gap-1.5">
                            <AnimatedNumber
                                value={displayLatency}
                                duration={latencyDuration}
                                isLoading={isLoading}
                                className={valueClass}
                            />
                            <span className="mb-0.5 text-xs font-bold text-text-main">ms</span>
                            {!isLoading && displayLatency > 0 ? (
                                <span className="mb-0.5 text-[0.65rem] font-medium text-text-muted">
                                    ({(displayLatency / 1000).toFixed(2)}s)
                                </span>
                            ) : null}
                        </div>
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong pt-3 md:border-l md:border-t-0 md:px-5 md:pt-0 lg:py-0 lg:pl-5 lg:pr-0">
                    <KpiTile
                        label={kpis.commands}
                        icon={Command}
                        iconClass="border-primary/25 bg-transparent text-primary"
                        subtext={timeRange === 'today' ? kpis.commandsToday : kpis.commands7d}
                    >
                        <AnimatedNumber
                            value={displayCommands}
                            duration={1500}
                            isLoading={isLoading}
                            className={valueClass}
                        />
                    </KpiTile>
                </div>
            </div>
        </AnalyticsSection>
    );
}
