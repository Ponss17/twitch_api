import { useMemo } from 'react';
import { Timer } from 'lucide-react';
import { AnalyticsSection, AnalyticsSimpleList, AnalyticsEmptyState } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';

interface LatencyEntry {
    name: string;
    value: number;
    avgLatency: number;
    successRate?: string;
}

interface AnalyticsLatencyChartProps {
    active: boolean;
    pieData: LatencyEntry[];
}

export function AnalyticsLatencyChart({ pieData }: AnalyticsLatencyChartProps) {
    const { t } = useTranslation();
    const chart = t.analytics.latencyChart;

    const rows = useMemo(() => {
        return pieData
            .filter((d) => Number(d.avgLatency) > 0)
            .slice()
            .sort((a, b) => b.avgLatency - a.avgLatency)
            .map((entry) => ({
                id: entry.name,
                left: entry.name,
                right: `${Math.round(entry.avgLatency)} ms`,
                title: entry.name
            }));
    }, [pieData]);

    return (
        <AnalyticsSection
            panelClassName="h-[270px] flex flex-col"
            title={chart.title}
            info={chart.info}
        >
            <AnalyticsSimpleList
                leftHeader={chart.colCommand}
                rightHeader={chart.colLatency}
                rows={rows}
                empty={
                    <AnalyticsEmptyState
                        icon={Timer}
                        title={chart.noData}
                        description={chart.noDataSub}
                    />
                }
            />
        </AnalyticsSection>
    );
}
