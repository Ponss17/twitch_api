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
    const hue = (330 - index * 25 + 360) % 360;
    const baseColor = `hsl(${hue}, 90%, 65%)`;
    const bgGradient = `linear-gradient(to right, hsla(${hue}, 90%, 65%, 0.15), hsla(${hue}, 90%, 65%, 0.02), transparent)`;
    const glowShadow = `0 0 12px hsla(${hue}, 90%, 65%, 0.5)`;

    const cellPad = compact ? 'px-3 py-1.5' : 'px-5 py-3';

    return (
        <tr
            className="animate-fade-soft transition hover:bg-white/[0.02]"
            style={{
                background: bgGradient,
                borderLeft: `3px solid ${baseColor}`
            }}
        >
            <td className={`border-b border-white/[0.03] align-middle ${cellPad}`}>
                <span className={`inline-block font-semibold ${compact ? 'text-[1rem]' : 'text-[1.1rem]'}`} style={{ color: baseColor }}>
                    #{index + 1}
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
                        className="h-full rounded transition-[width] duration-500"
                        style={{
                            width: `${(count / maxCount) * 100}%`,
                            backgroundColor: baseColor,
                            boxShadow: glowShadow
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
