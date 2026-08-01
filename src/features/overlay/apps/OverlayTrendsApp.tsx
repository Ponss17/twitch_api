import { useOverlayMirror } from '@/features/overlay/hooks/useOverlayMirror';
import { useOverlayTrendsRemaining } from '@/features/overlay/hooks/useOverlayTrendsRemaining';
import { useTrendsOverlayVisible } from '@/features/overlay/hooks/useOverlayVisibilityClock';
import { TrendsLeaderboardDisplay } from '@/features/trends/TrendsLeaderboardDisplay';
import { rankWordCounts } from '@/features/trends/lib/rankWordCounts';
import { OverlayConnectionBanners } from '@/features/overlay/components/OverlayConnectionBanners';
import { OverlaySessionGate } from '@/features/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/overlay/components/OverlaySessionProvider';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import type { TrendsOverlayState } from '@/features/overlay/lib/types';
import type { Session } from '@/core/config/config';
import { I18nProvider, useTranslation } from '@/core/i18n/I18nContext';

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
        <div className="min-h-screen overflow-hidden p-1 text-[#fafafa]">
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

function OverlayTrendsBoundary() {
    const { t } = useTranslation();
    return (
        <ErrorBoundary title={t.overlay.apps.trendsErrorTitle}>
            <OverlayTrendsApp />
        </ErrorBoundary>
    );
}

/** Raíz única para Astro (un solo client:only — SessionProvider envuelve el árbol). */
export function OverlayTrendsRoot() {
    return (
        <I18nProvider>
            <OverlaySessionProvider requireAuth>
                <OverlayTrendsBoundary />
            </OverlaySessionProvider>
        </I18nProvider>
    );
}
