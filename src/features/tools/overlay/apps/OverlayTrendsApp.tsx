import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { useOverlayTrendsRemaining } from '@/features/tools/overlay/hooks/useOverlayTrendsRemaining';
import { useTrendsOverlayVisible } from '@/features/tools/overlay/hooks/useOverlayVisibilityClock';
import { TrendsLeaderboardDisplay } from '@/features/tools/trends/components/TrendsLeaderboardDisplay';
import { rankWordCounts } from '@/features/tools/trends/lib/rankWordCounts';
import { OverlayConnectionBanners } from '@/features/tools/overlay/components/OverlayConnectionBanners';
import { OverlaySessionGate } from '@/features/tools/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/tools/overlay/components/OverlaySessionProvider';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';
import type { Session } from '@/core/config/config';

function OverlayTrendsContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('trends', session);
    const trendsState = state as TrendsOverlayState;
    const displayRemaining = useOverlayTrendsRemaining(trendsState);
    const visible = useTrendsOverlayVisible(trendsState);
    const { ranked, maxCount } = rankWordCounts(trendsState.wordCounts);

    if (!visible) {
        return <div className="min-h-screen" aria-hidden />;
    }

    return (
        <div className="min-h-screen p-2 text-[#fafafa]">
            <OverlayConnectionBanners connected={connected} stale={stale} />
            <TrendsLeaderboardDisplay
                ranked={ranked}
                maxCount={maxCount}
                tracking={trendsState.tracking}
                remaining={displayRemaining}
                timerEnded={trendsState.timerEnded}
                sessionActive={trendsState.sessionActive}
                displayName={trendsState.displayName}
                variant="overlay"
                showTimer={trendsState.tracking}
            />
        </div>
    );
}

function OverlayTrendsApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayTrendsContent session={session} />}
        </OverlaySessionGate>
    );
}

/** Raíz única para Astro (un solo client:only — SessionProvider envuelve el árbol). */
export function OverlayTrendsRoot() {
    return (
        <OverlaySessionProvider requireAuth>
            <ErrorBoundary title="Overlay de tendencias">
                <OverlayTrendsApp />
            </ErrorBoundary>
        </OverlaySessionProvider>
    );
}
