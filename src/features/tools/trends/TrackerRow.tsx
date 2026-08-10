import { hoverSubtleRowBg } from '@/core/utils/tw';

const ANALYTICS_COLORS = ['#7254b8', '#4a8b75', '#b3934d', '#b35656', '#4d75b3', '#b3714d', '#a85c87', '#615e9c'];

export function TrackerRow({
    word,
    count,
    index,
    maxCount,
    compact = false
}: {
    word: string;
    count: number;
    index: number;
    maxCount: number;
    compact?: boolean;
}) {
    const cellPad = compact ? 'px-3 py-1.5' : 'px-5 py-3';
    const rowColor = ANALYTICS_COLORS[index % ANALYTICS_COLORS.length];

    return (
        <tr className={`animate-fade-soft duration-200 ${hoverSubtleRowBg}`}>
            <td className={`border-b border-border-subtle align-middle ${cellPad}`}>
                <span className={`inline-block font-medium ${compact ? 'text-[0.875rem]' : 'text-[1rem]'}`} style={{ color: rowColor }}>
                    #{index + 1}
                </span>
            </td>
            <td
                className={`word-text border-b border-border-subtle align-middle font-medium capitalize text-text-muted tracking-[0.5px] ${cellPad} ${
                    compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
                }`}
            >
                {word}
            </td>
            <td
                className={`count-text border-b border-border-subtle text-right align-middle font-[Consolas,monospace] text-text-main ${cellPad} ${
                    compact ? 'text-[0.8125rem]' : 'text-[0.9375rem]'
                }`}
            >
                {count.toLocaleString()}
            </td>
            <td className={`border-b border-border-subtle align-middle ${cellPad}`}>
                <div className={`w-full overflow-hidden rounded-full bg-border-strong ${compact ? 'h-1.5' : 'h-2'}`}>
                    <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                            width: `${(count / maxCount) * 100}%`,
                            backgroundColor: rowColor,
                            boxShadow: `0 0 10px ${rowColor}66`
                        }}
                    />
                </div>
            </td>
        </tr>
    );
}

export function formatTrendsTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    return `${m}:${(seconds % 60).toString().padStart(2, '0')}`;
}
