import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { useRequiredSession } from '@/core/session/useSession';
import { TrendsLeaderboardDisplay } from '@/features/tools/trends/components/TrendsLeaderboardDisplay';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';

export function OverlayTrendsApp() {
    const session = useRequiredSession();
    const { state, connected, stale } = useOverlayMirror('trends', session);
    const trendsState = state as TrendsOverlayState;

    const ranked = Object.entries(trendsState.wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxCount = ranked[0]?.[1] ?? 1;

    return (
        <div className="min-h-screen p-2 text-[#fafafa]">
            {!connected || stale ? (
                <p className="rounded-lg bg-black/50 px-4 py-2 text-[0.75rem] text-[#a1a1aa] backdrop-blur-sm">
                    {!connected ? 'Conectando overlay…' : 'Esperando datos del panel…'}
                </p>
            ) : (
                <TrendsLeaderboardDisplay
                    ranked={ranked}
                    maxCount={maxCount}
                    tracking={trendsState.tracking}
                    remaining={trendsState.remaining}
                    timerEnded={trendsState.timerEnded}
                    sessionActive={trendsState.sessionActive}
                    displayName={trendsState.displayName}
                    variant="overlay"
                    showTimer
                />
            )}
        </div>
    );
}
