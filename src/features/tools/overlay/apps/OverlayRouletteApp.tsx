import { useEffect, useState } from 'react';
import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { RouletteWheelDisplay } from '@/features/tools/roulette/components/RouletteWheelDisplay';
import { OverlaySessionGate } from '@/features/tools/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/tools/overlay/components/OverlaySessionProvider';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { shouldShowRouletteOverlay } from '@/features/tools/overlay/lib/overlayStateUtils';
import type { RouletteOverlayState } from '@/features/tools/overlay/lib/types';
import type { Session } from '@/core/config/config';

function OverlayRouletteContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('roulette', session);
    const rouletteState = state as RouletteOverlayState;
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!rouletteState.winner || rouletteState.isOpen || rouletteState.isSpinning) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [rouletteState.winner, rouletteState.isOpen, rouletteState.isSpinning]);

    const visible = shouldShowRouletteOverlay(rouletteState, now);

    if (!visible) {
        return <div className="min-h-screen" aria-hidden />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="flex flex-col items-center gap-2">
                {!connected && <OverlayStatusBanner message="Conectando overlay…" />}
                {connected && stale && (
                    <OverlayStatusBanner message="Esperando datos del panel…" />
                )}
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

export function OverlayRouletteApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayRouletteContent session={session} />}
        </OverlaySessionGate>
    );
}

/** Raíz única para Astro (un solo client:only — SessionProvider envuelve el árbol). */
export function OverlayRouletteRoot() {
    return (
        <OverlaySessionProvider requireAuth>
            <ErrorBoundary title="Overlay de ruleta">
                <OverlayRouletteApp />
            </ErrorBoundary>
        </OverlaySessionProvider>
    );
}
