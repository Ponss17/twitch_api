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

    return (
        <tr className="animate-fade-soft transition-colors duration-200 hover:bg-white/[0.02]">
            <td className={`border-b border-white/[0.03] align-middle ${cellPad}`}>
                <span className={`inline-block font-medium text-zinc-500 ${compact ? 'text-[0.875rem]' : 'text-[1rem]'}`}>
                    #{index + 1}
                </span>
            </td>
            <td
                className={`word-text border-b border-white/[0.03] align-middle font-medium capitalize text-zinc-200 tracking-[0.5px] ${cellPad} ${
                    compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
                }`}
            >
                {word}
            </td>
            <td
                className={`count-text border-b border-white/[0.03] text-right align-middle font-[Consolas,monospace] text-white ${cellPad} ${
                    compact ? 'text-[0.8125rem]' : 'text-[0.9375rem]'
                }`}
            >
                {count.toLocaleString()}
            </td>
            <td className={`border-b border-white/[0.03] align-middle ${cellPad}`}>
                <div className={`w-full overflow-hidden rounded-full bg-white/5 ${compact ? 'h-1.5' : 'h-2'}`}>
                    <div
                        className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-[width] duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
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
