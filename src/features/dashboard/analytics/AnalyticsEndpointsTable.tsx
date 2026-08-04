import React from 'react';
import { Activity } from 'lucide-react';
import { COLORS, AnalyticsSection } from './AnalyticsShared';
import { useTranslation } from '@/core/i18n/I18nContext';

interface AnalyticsEndpointsTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsEndpointsTable({ pieData }: AnalyticsEndpointsTableProps) {
    const { t } = useTranslation();
    const aT = t.analytics.endpointsTable;

    return (
        <AnalyticsSection
            panelClassName="min-h-[360px]"
            title={aT.title}
            info={aT.info}
        >
            {pieData.length === 0 ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-transparent">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-text-main/5">
                        <Activity className="h-6 w-6 text-text-muted" />
                    </div>
                    <span className="text-sm font-medium text-text-muted">{aT.noData}</span>
                    <span className="mt-1 text-xs text-text-muted">
                        {aT.noDataSub}
                    </span>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border-subtle text-text-muted">
                                <th className="pb-3 font-medium">{aT.headers.command}</th>
                                <th className="pb-3 text-right font-medium">{aT.headers.requests}</th>
                                <th className="pb-3 text-right font-medium">{aT.headers.success}</th>
                                <th className="pb-3 text-right font-medium">{aT.headers.latency}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pieData.map((row, idx) => (
                                <tr
                                    key={row.name}
                                    className="border-b border-border-subtle last:border-0"
                                >
                                    <td className="py-3 capitalize text-text-main">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor: COLORS[idx % COLORS.length]
                                                }}
                                            />
                                            {row.name}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right font-medium text-text-main">
                                        {row.value.toLocaleString()}
                                    </td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
                                                parseFloat(row.successRate) > 95
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : parseFloat(row.successRate) > 80
                                                      ? 'bg-yellow-500/10 text-yellow-400'
                                                      : 'bg-red-500/10 text-red-400'
                                            }`}
                                        >
                                            {row.successRate}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-mono text-xs text-text-muted">
                                        {row.avgLatency}ms
                                        <span className="ml-1 text-[0.65rem] text-text-muted">
                                            ({(row.avgLatency / 1000).toFixed(2)}s)
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AnalyticsSection>
    );
}
