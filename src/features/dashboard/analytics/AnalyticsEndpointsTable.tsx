import React from 'react';
import { Activity } from 'lucide-react';
import { COLORS, AnalyticsSection } from './AnalyticsShared';

interface AnalyticsEndpointsTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsEndpointsTable({ pieData }: AnalyticsEndpointsTableProps) {
    return (
        <AnalyticsSection
            panelClassName="min-h-[360px]"
            title="Comandos más usados"
            info="Lista de comandos con peticiones, éxito y latencia media."
        >
            {pieData.length === 0 ? (
                <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                        <Activity className="h-6 w-6 text-zinc-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-400">Sin datos suficientes</span>
                    <span className="mt-1 text-xs text-zinc-400">
                        Ejecuta comandos en tu canal para generar historial
                    </span>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-[#8b8b93]">
                                <th className="pb-3 font-medium">Comando</th>
                                <th className="pb-3 text-right font-medium">Peticiones</th>
                                <th className="pb-3 text-right font-medium">Éxito</th>
                                <th className="pb-3 text-right font-medium">Latencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pieData.map((row, idx) => (
                                <tr
                                    key={row.name}
                                    className="border-b border-white/[0.04] last:border-0"
                                >
                                    <td className="py-3 capitalize text-zinc-200">
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
                                    <td className="py-3 text-right font-medium text-white">
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
                                    <td className="py-3 text-right font-mono text-xs text-zinc-400">
                                        {row.avgLatency}ms
                                        <span className="ml-1 text-[0.65rem] text-zinc-600">
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
