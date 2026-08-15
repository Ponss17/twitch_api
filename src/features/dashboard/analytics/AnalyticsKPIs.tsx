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
        <div className="flex items-center rounded-lg border border-border-subtle bg-bg-main p-0.5">
            <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`rounded-md px-3 py-1 text-xs ${
                    timeRange === 'today'
                        ? 'bg-primary/20 font-semibold text-brand-text'
                        : `font-medium text-text-muted ${hoverSubtleChip}`
                }`}
            >
                {t.analytics.kpis.today}
            </button>
            <button
                type="button"
                onClick={() => setTimeRange('7d')}
                className={`rounded-md px-3 py-1 text-xs ${
                    timeRange === '7d'
                        ? 'bg-primary/20 font-semibold text-brand-text'
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
        <div className="flex flex-col gap-2 px-1 py-1">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[0.75rem] font-medium text-text-muted">{label}</span>
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md border ${iconClass}`}
                >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
            </div>
            <div className="flex flex-col">
                {children}
                <span className="mt-1 text-[0.7rem] font-medium text-text-muted">{subtext}</span>
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

    return (
        <AnalyticsSection
            title={kpis.title}
            info={kpis.info}
            action={<RangeToggle timeRange={timeRange} setTimeRange={setTimeRange} t={t} />}
            panelClassName=""
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" aria-busy={isLoading}>
                <div className="pb-4 md:pr-6 lg:pb-0">
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
                            className="text-[1.75rem] font-bold leading-none tracking-tight text-text-main"
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong py-4 md:border-l md:border-t-0 md:px-6 lg:py-0">
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
                            className="text-[1.75rem] font-bold leading-none tracking-tight text-text-main"
                        />
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong py-4 md:pr-6 lg:border-l lg:border-t-0 lg:px-6 lg:py-0">
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
                                className="text-[1.75rem] font-bold leading-none tracking-tight text-text-main"
                            />
                            <span className="mb-0.5 text-sm font-bold text-text-main">ms</span>
                            {!isLoading && displayLatency > 0 ? (
                                <span className="mb-1 text-xs font-medium text-text-muted">
                                    ({(displayLatency / 1000).toFixed(2)}s)
                                </span>
                            ) : null}
                        </div>
                    </KpiTile>
                </div>

                <div className="border-t border-border-strong pt-4 md:border-l md:border-t-0 md:px-6 md:pt-0 lg:py-0 lg:pl-6 lg:pr-0">
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
                            className="text-[1.75rem] font-bold leading-none tracking-tight text-text-main"
                        />
                    </KpiTile>
                </div>
            </div>
        </AnalyticsSection>
    );
}
