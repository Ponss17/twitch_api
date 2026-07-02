import { useOverlayMirror } from '@/features/tools/overlay/hooks/useOverlayMirror';
import { useRequiredSession } from '@/core/session/useSession';
import { RouletteWheelDisplay } from '@/features/tools/roulette/components/RouletteWheelDisplay';
import type { RouletteOverlayState } from '@/features/tools/overlay/lib/types';

export function OverlayRouletteApp() {
    const session = useRequiredSession();
    const { state, connected, stale } = useOverlayMirror('roulette', session);
    const rouletteState = state as RouletteOverlayState;

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            {!connected || stale ? (
                <p className="rounded-lg bg-black/50 px-4 py-2 text-[0.75rem] text-[#a1a1aa] backdrop-blur-sm">
                    {!connected ? 'Conectando overlay…' : 'Esperando datos del panel…'}
                </p>
            ) : (
                <RouletteWheelDisplay
                    chatters={rouletteState.chatters}
                    wheelRotation={rouletteState.wheelRotation}
                    wheelTransition={rouletteState.wheelTransition}
                    isSpinning={rouletteState.isSpinning}
                    winner={rouletteState.winner}
                    lastSpinCount={rouletteState.lastSpinCount}
                    variant="overlay"
                />
            )}
        </div>
    );
}
