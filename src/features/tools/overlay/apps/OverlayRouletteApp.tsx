import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { RouletteWheelDisplay } from '@/features/tools/roulette/components/RouletteWheelDisplay';
import { OverlaySessionGate } from '@/features/tools/overlay/components/OverlaySessionGate';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';
import type { RouletteOverlayState } from '@/features/tools/overlay/lib/types';
import type { Session } from '@/core/config/config';

function OverlayRouletteContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('roulette', session);
    const rouletteState = state as RouletteOverlayState;

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
