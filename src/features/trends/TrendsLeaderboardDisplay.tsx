import { Clock, Play } from 'lucide-react';
import { TrackerRow, formatTrendsTime } from '@/features/trends/TrackerRow';
import { EmptyStateIcon } from '@/shared/ui/Icon';

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
    const showReady = !sessionActive && ranked.length === 0;
    const showWaiting = tracking && ranked.length === 0;
    const isOverlay = variant === 'overlay';
    const headPad = isOverlay ? 'px-3 py-2' : 'px-5 py-3.5';
    const headText = isOverlay ? 'text-[0.625rem]' : 'text-[0.6875rem]';

    return (
        <div className={isOverlay ? '' : 'overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]'}>
            {(showTimer || (isOverlay && tracking)) && (
                <div
                    className={`flex items-center justify-center gap-2 ${
                        isOverlay ? 'px-3 py-2' : 'px-4 py-3'
                    } ${isOverlay ? '' : 'border-b border-white/[0.08] bg-warning/5'}`}
                    role="timer"
                    aria-live="polite"
                    aria-label={`Cuenta atrás: ${formatTrendsTime(remaining)}`}
                >
                    <Clock className="text-warning" />
                    <span className="text-[0.6875rem] font-semibold tracking-wide text-warning/80 uppercase">
                        Restante
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
                <div className="border-b border-white/[0.08] px-5 py-3">
                    <h2 className="text-[0.95rem] font-bold">Tendencias de {displayName}</h2>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-white/[0.08] bg-black/20">
                            <th
                                className={`w-[44px] text-left font-bold tracking-wide text-[#c4c4cc] uppercase ${headPad} ${headText}`}
                            >
                                #
                            </th>
                            <th
                                className={`text-left font-bold tracking-wide text-[#c4c4cc] uppercase ${headPad} ${headText}`}
                            >
                                Palabra
                            </th>
                            <th
                                className={`text-right font-bold tracking-wide text-[#c4c4cc] uppercase ${headPad} ${headText}`}
                            >
                                Repeticiones
                            </th>
                            <th className={`w-1/2 ${headPad}`} />
                        </tr>
                    </thead>
                    <tbody>
                        {showReady && !isOverlay ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-[#71717a]">
                                    <EmptyStateIcon icon={Play} />
                                    <h4 className="mb-1 text-[0.8125rem] font-bold text-[#fafafa]">
                                        Listo para analizar
                                    </h4>
                                    <p className="text-[0.8125rem]">
                                        Presiona el botón <strong className="text-[#fafafa]">Play</strong> para
                                        comenzar a contar palabras.
                                    </p>
                                </td>
                            </tr>
                        ) : showWaiting ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-5 text-center text-[0.8125rem] text-[#71717a]">
                                    Esperando palabras...
                                </td>
                            </tr>
                        ) : ranked.length === 0 && isOverlay ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-5 text-center text-[0.8125rem] text-[#71717a]">
                                    Sin datos aún
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
