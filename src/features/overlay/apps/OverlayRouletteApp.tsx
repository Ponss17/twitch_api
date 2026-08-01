import { useOverlayMirror } from '@/features/overlay/hooks/useOverlayMirror';
import { useRouletteOverlayVisible } from '@/features/overlay/hooks/useOverlayVisibilityClock';
import { RouletteWheelDisplay } from '@/features/roulette/RouletteWheelDisplay';
import { OverlayConnectionBanners } from '@/features/overlay/components/OverlayConnectionBanners';
import { OverlaySessionGate } from '@/features/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/overlay/components/OverlaySessionProvider';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import type { RouletteOverlayState } from '@/features/overlay/lib/types';
import type { Session } from '@/core/config/config';
import { I18nProvider, useTranslation } from '@/core/i18n/I18nContext';

function OverlayRouletteContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('roulette', session);
    const rouletteState = state as RouletteOverlayState;
    const visible = useRouletteOverlayVisible(rouletteState);

    if (!visible) {
        return <div className="min-h-screen" aria-hidden />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center overflow-hidden p-4">
            <div className="flex flex-col items-center gap-2">
                <OverlayConnectionBanners connected={connected} stale={stale} />
                <RouletteWheelDisplay
                    chatters={rouletteState.chatters}
                    wheelRotation={rouletteState.wheelRotation}
                    wheelTransition={rouletteState.wheelTransition}
                    isSpinning={rouletteState.isSpinning}
                    winner={rouletteState.winner}
                    lastSpinCount={rouletteState.lastSpinCount}
                    variant="overlay"
                />
            </div>
        </div>
    );
}

function OverlayRouletteApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayRouletteContent session={session} />}
        </OverlaySessionGate>
    );
}

function OverlayRouletteBoundary() {
    const { t } = useTranslation();
    return (
        <ErrorBoundary title={t.overlay.apps.rouletteErrorTitle}>
            <OverlayRouletteApp />
        </ErrorBoundary>
    );
}

/** Raíz única para Astro (un solo client:only — SessionProvider envuelve el árbol). */
export function OverlayRouletteRoot() {
    return (
        <I18nProvider>
            <OverlaySessionProvider requireAuth>
                <OverlayRouletteBoundary />
            </OverlaySessionProvider>
        </I18nProvider>
    );
}
