import type { OverlayTool, RouletteOverlayState, TrendsOverlayState } from '@/features/tools/overlay/lib/types';

type OverlayPayload = RouletteOverlayState | TrendsOverlayState;

/** Huella estable — ignora `updatedAt` (cambia en cada build pero no el contenido lógico). */
export function overlayStateFingerprint(
    tool: OverlayTool,
    state: OverlayPayload
): string {
    const { updatedAt: _u, ...rest } = state;
    return JSON.stringify({ tool, ...rest });
}

/** Segundos restantes del timer en el cliente OBS (sin polling cada segundo). */
export function overlayTrendsRemaining(state: TrendsOverlayState, now = Date.now()): number {
    if (!state.tracking || state.timerEnded) return state.remaining;

    if (state.timerEndsAt !== undefined) {
        return Math.max(0, Math.ceil((state.timerEndsAt - now) / 1000));
    }

    const elapsedSec = Math.floor((now - state.updatedAt) / 1000);
    return Math.max(0, state.remaining - elapsedSec);
}
