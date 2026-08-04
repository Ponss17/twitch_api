import { Clock, Play } from 'lucide-react';
import { TrackerRow, formatTrendsTime } from '@/features/trends/TrackerRow';
import { EmptyStateIcon } from '@/shared/ui/Icon';
import { useTranslation } from '@/core/i18n/I18nContext';

export type TrendsLeaderboardVariant = 'full' | 'overlay';

export interface TrendsLeaderboardDisplayProps {
    ranked: [string, number][];
    maxCount: number;
    tracking: boolean;
    remaining: number;
    timerEnded: boolean;
    sessionActive: boolean;
    displayName: string;
    variant?: TrendsLeaderboardVariant;
    showTimer?: boolean;
}

export function TrendsLeaderboardDisplay({
    ranked,
    maxCount,
    tracking,
    remaining,
    timerEnded,
    sessionActive,
    displayName,
    variant = 'full',
    showTimer = false
}: TrendsLeaderboardDisplayProps) {
    const { t } = useTranslation();
    const trends = t.trends;
    
    const showReady = !sessionActive && ranked.length === 0;
    const showWaiting = tracking && ranked.length === 0;
    const isOverlay = variant === 'overlay';
    const headPad = isOverlay ? 'px-3 py-2' : 'px-5 py-3.5';
    const headText = isOverlay ? 'text-[0.625rem]' : 'text-[0.6875rem]';

    return (
        <div className={isOverlay ? '' : 'overflow-hidden rounded-xl border border-border-strong bg-bg-secondary'}>
            {(showTimer || (isOverlay && tracking)) && (
                <div
                    className={`flex items-center justify-center gap-2 ${
                        isOverlay ? 'px-3 py-2' : 'px-4 py-3'
                    } ${isOverlay ? '' : 'border-b border-border-strong bg-warning/5'}`}
                    role="timer"
                    aria-live="polite"
                    aria-label={trends.countdown(formatTrendsTime(remaining))}
                >
                    <Clock className="text-warning" />
                    <span className="text-[0.6875rem] font-semibold tracking-wide text-warning/80 uppercase">
                        {trends.remaining}
                    </span>
                    <span
                        className={`min-w-[3.5rem] text-center font-[Consolas,monospace] text-[1.125rem] font-bold tracking-wider text-warning ${
                            timerEnded ? 'opacity-60' : ''
                        }`}
                    >
                        {formatTrendsTime(remaining)}
                    </span>
                </div>
            )}

            {!isOverlay && (
                <div className="border-b border-border-strong px-5 py-3">
                    <h2 className="text-[0.95rem] font-bold">{trends.title(displayName)}</h2>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border-strong bg-bg-secondary">
                            <th
                                className={`w-[44px] text-left font-bold tracking-wide text-text-muted uppercase ${headPad} ${headText}`}
                            >
                                #
                            </th>
                            <th
                                className={`text-left font-bold tracking-wide text-text-muted uppercase ${headPad} ${headText}`}
                            >
                                {trends.table.word}
                            </th>
                            <th
                                className={`text-right font-bold tracking-wide text-text-muted uppercase ${headPad} ${headText}`}
                            >
                                {trends.table.reps}
                            </th>
                            <th className={`w-1/2 ${headPad}`} />
                        </tr>
                    </thead>
                    <tbody>
                        {showReady && !isOverlay ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                                    <EmptyStateIcon icon={Play} />
                                    <h4 className="mb-1 text-[0.8125rem] font-bold text-text-main">
                                        {trends.table.readyTitle}
                                    </h4>
                                    <p className="text-[0.8125rem]">
                                        {trends.table.readyDesc}
                                    </p>
                                </td>
                            </tr>
                        ) : showWaiting ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-5 text-center text-[0.8125rem] text-text-muted">
                                    {trends.table.waiting}
                                </td>
                            </tr>
                        ) : ranked.length === 0 && isOverlay ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-5 text-center text-[0.8125rem] text-text-muted">
                                    {trends.table.noData}
                                </td>
                            </tr>
                        ) : (
                            ranked.map(([word, count], i) => (
                                <TrackerRow
                                    key={word}
                                    word={word}
                                    count={count}
                                    index={i}
                                    maxCount={maxCount}
                                    compact={isOverlay}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
