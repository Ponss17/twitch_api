import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartMountGate, AnalyticsSection } from './AnalyticsShared';

interface AnalyticsAreaChartProps {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    areaData: any[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="pointer-events-none rounded-xl border border-white/10 bg-[#18181b] p-3 shadow-xl">
                <p className="mb-1 text-xs font-semibold text-zinc-400">{label}</p>
                <span className="text-sm font-medium text-white">Peticiones : {payload[0].value}</span>
            </div>
        );
    }
    return null;
};

export function AnalyticsAreaChart({ active, areaData }: AnalyticsAreaChartProps) {
    return (
        <AnalyticsSection
            className="col-span-1 lg:col-span-2"
            panelClassName="h-[420px]"
            title="Peticiones por día"
            info="Evolución diaria del total de peticiones en la última semana."
        >
            <ChartMountGate
                active={active}
                className="min-h-0 w-full min-w-0 flex-1"
                srLabel="Gráfico de área mostrando peticiones de los últimos 7 días."
            >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                        data={areaData}
                        margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                        accessibilityLayer={false}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff"
                            strokeOpacity={0.06}
                            vertical={true}
                            horizontal={true}
                        />
                        <XAxis
                            dataKey="date"
                            stroke="#71717a"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: '#ffffff', strokeOpacity: 0.3, strokeWidth: 1.5 }}
                            tickMargin={12}
                            tickFormatter={(val) => {
                                const parts = val.split('-');
                                return `${parts[2]}/${parts[1]}`;
                            }}
                        />
                        <YAxis
                            stroke="#71717a"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, (dataMax: number) => (dataMax === 0 ? 10 : dataMax)]}
                            allowDecimals={false}
                            tickMargin={12}
                        />
                        <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={false} 
                            isAnimationActive={false} 
                            wrapperStyle={{ pointerEvents: 'none', outline: 'none' }} 
                        />
                        <Area
                            type="monotone"
                            dataKey="requests"
                            name="Peticiones"
                            stroke="#9146ff"
                            strokeWidth={3}
                            strokeDasharray="6 6"
                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#18181b', fill: '#9146ff' }}
                            fillOpacity={0.38}
                            fill="#9146ff"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartMountGate>
        </AnalyticsSection>
    );
}
