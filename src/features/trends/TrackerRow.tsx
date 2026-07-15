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
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    const rankClass =
        index === 0
            ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-l-[3px] border-amber-400'
            : index === 1
              ? 'bg-gradient-to-r from-slate-300/15 via-slate-300/5 to-transparent border-l-[3px] border-slate-300'
              : index === 2
                ? 'bg-gradient-to-r from-orange-600/15 via-orange-600/5 to-transparent border-l-[3px] border-orange-500'
                : 'border-l-[3px] border-transparent';

    const cellPad = compact ? 'px-3 py-1.5' : 'px-5 py-3';

    return (
        <tr className={`animate-fade-soft transition hover:bg-white/[0.02] ${rankClass}`}>
            <td className={`border-b border-white/[0.03] align-middle ${cellPad}`}>
                <span className={`inline-block ${compact ? 'text-[1rem]' : 'text-[1.2rem]'}`}>
                    {medal}
                </span>
            </td>
            <td
                className={`word-text border-b border-white/[0.03] align-middle font-semibold tracking-[0.5px] ${cellPad} ${
                    compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
                }`}
            >
                {word}
            </td>
            <td
                className={`count-text border-b border-white/[0.03] text-right align-middle font-[Consolas,monospace] opacity-90 ${cellPad} ${
                    compact ? 'text-[0.8125rem]' : 'text-[0.9375rem]'
                }`}
            >
                {count}
            </td>
            <td className={`border-b border-white/[0.03] align-middle ${cellPad}`}>
                <div className={`w-full overflow-hidden rounded bg-white/5 ${compact ? 'h-1.5' : 'h-2'}`}>
                    <div
                        className="h-full rounded bg-primary shadow-[0_0_10px_rgba(168,85,247,0.4)] transition-[width] duration-500"
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
