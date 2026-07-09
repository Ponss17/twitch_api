import React from 'react';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { COLORS } from './AnalyticsShared';

interface AnalyticsEndpointsTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pieData: any[];
}

export function AnalyticsEndpointsTable({ pieData }: AnalyticsEndpointsTableProps) {
    return (
        <div className="rounded-xl border border-white/[0.08] bg-bg-card p-6 transition-colors duration-200 hover:border-primary/50">
            <div className="mb-6 border-b border-white/[0.08] pb-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-[#fafafa]">Endpoints Más Usados</h2>
                        <p className="mt-1 text-[0.8rem] text-[#c4c4cc]">Acumulado de los últimos 7 días</p>
                    </div>
                    <InfoTooltip text="Lista detallada de las herramientas más consultadas de tu API en los últimos 7 días." />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/[0.05] text-zinc-500">
                            <th className="pb-3 font-medium">Comando</th>
                            <th className="pb-3 font-medium text-right">Peticiones</th>
                            <th className="pb-3 font-medium text-right">Éxito</th>
                            <th className="pb-3 font-medium text-right">Latencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pieData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-zinc-500">No hay datos suficientes</td>
                            </tr>
                        ) : (
                            pieData.map((row, idx) => (
                                <tr key={row.name} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3.5 capitalize text-zinc-200">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                            {row.name}
                                        </div>
                                    </td>
                                    <td className="py-3.5 text-right font-medium text-white">{row.value.toLocaleString()}</td>
                                    <td className="py-3.5 text-right">
                                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${parseFloat(row.successRate) > 95 ? 'bg-emerald-500/10 text-emerald-400' : parseFloat(row.successRate) > 80 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {row.successRate}%
                                        </span>
                                    </td>
                                    <td className="py-3.5 text-right text-zinc-400 font-mono text-xs">
                                        {row.avgLatency}ms
                                        <span className="ml-1 text-[0.65rem] text-zinc-600">({(row.avgLatency / 1000).toFixed(2)}s)</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
