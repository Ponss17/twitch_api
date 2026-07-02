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
export const ROULETTE_OVERLAY_WINNER_MS = 20_000;

/** OBS transparente en reposo; tras el timer muestra resultados y luego se apaga. */
export function shouldShowTrendsOverlay(
    state: TrendsOverlayState,
    now = Date.now(),
    endedAt?: number | null
): boolean {
    if (state.tracking) return true;
    if (!state.sessionActive) return false;

    if (state.timerEnded) {
        const anchor = endedAt ?? state.updatedAt ?? 0;
        return now - anchor < TRENDS_OVERLAY_RESULTS_MS;
    }

    return Object.keys(state.wordCounts).length > 0;
}

/**
 * OBS transparente en reposo; visible con inscripciones abiertas, giro o ganador reciente.
 * Tras el tiempo del ganador se oculta aunque las inscripciones sigan abiertas en el panel.
 */
export function shouldShowRouletteOverlay(
    state: RouletteOverlayState,
    now = Date.now(),
    winnerShownAt?: number | null
): boolean {
    if (state.isSpinning) return true;

    if (state.winner) {
        const anchor = winnerShownAt ?? state.updatedAt ?? now;
        return now - anchor < ROULETTE_OVERLAY_WINNER_MS;
    }

    if (state.isOpen) return true;
    return false;
}
