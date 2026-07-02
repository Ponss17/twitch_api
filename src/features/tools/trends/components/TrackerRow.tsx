export function TrackerRow({
    word,
    count,
    index,
    maxCount
}: {
    word: string;
    count: number;
    index: number;
    maxCount: number;
}) {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    const rankClass =
        index === 0
            ? 'bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent'
            : index === 1
              ? 'bg-gradient-to-r from-[rgba(192,192,192,0.1)] to-transparent'
              : index === 2
                ? 'bg-gradient-to-r from-[rgba(205,127,50,0.1)] to-transparent'
                : '';

    return (
        <tr className={`animate-fade-soft transition hover:bg-white/[0.02] ${rankClass}`}>
            <td className="border-b border-white/[0.03] px-5 py-3 align-middle">
                <span className="inline-block text-[1.2rem]">{medal}</span>
            </td>
            <td className="word-text border-b border-white/[0.03] px-5 py-3 align-middle text-[0.8125rem] font-semibold tracking-[0.5px]">
                {word}
            </td>
            <td className="count-text border-b border-white/[0.03] px-5 py-3 text-right align-middle font-[Consolas,monospace] text-[0.9375rem] opacity-90">
                {count}
            </td>
            <td className="border-b border-white/[0.03] px-5 py-3 align-middle">
                <div className="h-2 w-full overflow-hidden rounded bg-white/5">
                    <div
                        className="h-full rounded bg-gradient-to-r from-primary to-[#db2777] shadow-[0_0_10px_rgba(145,70,255,0.4)] transition-[width] duration-500"
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
