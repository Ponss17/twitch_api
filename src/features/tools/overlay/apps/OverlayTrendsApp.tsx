import { useEffect, useState } from 'react';
import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { useOverlayTrendsRemaining } from '@/features/tools/overlay/hooks/useOverlayTrendsRemaining';
import { TrendsLeaderboardDisplay } from '@/features/tools/trends/components/TrendsLeaderboardDisplay';
import { OverlaySessionGate } from '@/features/tools/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/tools/overlay/components/OverlaySessionProvider';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { shouldShowTrendsOverlay } from '@/features/tools/overlay/lib/overlayStateUtils';
import type { TrendsOverlayState } from '@/features/tools/overlay/lib/types';
import type { Session } from '@/core/config/config';

function OverlayTrendsContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('trends', session);
    const trendsState = state as TrendsOverlayState;
    const displayRemaining = useOverlayTrendsRemaining(trendsState);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (trendsState.tracking) return;
        if (!trendsState.sessionActive || !trendsState.timerEnded) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [trendsState.tracking, trendsState.sessionActive, trendsState.timerEnded]);

    const visible = shouldShowTrendsOverlay(trendsState, now);

    const ranked = Object.entries(trendsState.wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const maxCount = ranked[0]?.[1] ?? 1;

    if (!visible) {
        return <div className="min-h-screen" aria-hidden />;
    }

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
                showTimer={trendsState.tracking}
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
