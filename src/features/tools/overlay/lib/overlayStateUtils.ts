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

/** Tiempo visible en OBS tras terminar el timer antes de ocultarse solo. */
export const TRENDS_OVERLAY_RESULTS_MS = 30_000;

/** OBS transparente en reposo; tras el timer muestra resultados y luego se apaga. */
export function shouldShowTrendsOverlay(state: TrendsOverlayState, now = Date.now()): boolean {
    if (state.tracking) return true;
    if (!state.sessionActive) return false;

    if (state.timerEnded) {
        const endedAt = state.updatedAt ?? 0;
        return now - endedAt < TRENDS_OVERLAY_RESULTS_MS;
    }

    return Object.keys(state.wordCounts).length > 0;
}
