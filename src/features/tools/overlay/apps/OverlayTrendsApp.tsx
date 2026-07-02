import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { useOverlayTrendsRemaining } from '@/features/tools/overlay/hooks/useOverlayTrendsRemaining';
import { TrendsLeaderboardDisplay } from '@/features/tools/trends/components/TrendsLeaderboardDisplay';
import { OverlaySessionGate } from '@/features/tools/overlay/components/OverlaySessionGate';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';
import type { Session } from '@/core/config/config';

function OverlayTrendsContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('trends', session);
    const trendsState = state as TrendsOverlayState;
    const displayRemaining = useOverlayTrendsRemaining(trendsState);

    const ranked = Object.entries(trendsState.wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxCount = ranked[0]?.[1] ?? 1;

    return (
        <div className="min-h-screen p-2 text-[#fafafa]">
            {!connected && <OverlayStatusBanner message="Conectando overlay…" />}
            {connected && stale && (
                <OverlayStatusBanner message="Esperando datos del panel…" />
            )}
            <TrendsLeaderboardDisplay
                ranked={ranked}
                maxCount={maxCount}
                tracking={trendsState.tracking}
                remaining={displayRemaining}
                timerEnded={trendsState.timerEnded}
                sessionActive={trendsState.sessionActive}
                displayName={trendsState.displayName}
                variant="overlay"
                showTimer
            />
        </div>
    );
}

export function OverlayTrendsApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayTrendsContent session={session} />}
        </OverlaySessionGate>
    );
}
