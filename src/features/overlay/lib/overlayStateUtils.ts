import type {
    AnyOverlayState,
    OverlayTool,
    QuestionsOverlayState,
    RouletteOverlayState,
    TrendsOverlayState
} from '@/features/overlay/lib/types';

/** Huella estable — ignora `updatedAt` (cambia en cada build pero no el contenido lógico). */
export function overlayStateFingerprint(tool: OverlayTool, state: AnyOverlayState): string {
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

/** Escucha pasiva en OBS — solo para detectar que el panel publicó una sesión nueva. */
export const OVERLAY_POLL_IDLE_MS = 60_000;
export const OVERLAY_POLL_TRENDS_MS = 2_500;
export const OVERLAY_POLL_QUESTIONS_MS = 2_500;
export const OVERLAY_POLL_ROULETTE_MS = 600;
export const OVERLAY_POLL_SPINNING_MS = 300;

export interface OverlayPollAnchors {
    winnerShownAt: number | null;
    trendsEndedAt: number | null;
    lastSpinSeq: number;
    wasTracking: boolean;
}

export function updateOverlayPollAnchors(
    tool: OverlayTool,
    state: AnyOverlayState | null,
    anchors: OverlayPollAnchors
): void {
    if (!state) return;

    if (tool === 'roulette') {
        const roulette = state as RouletteOverlayState;
        if (!roulette.winner) {
            anchors.winnerShownAt = null;
            anchors.lastSpinSeq = -1;
            return;
        }
        if (roulette.spinSeq !== anchors.lastSpinSeq) {
            anchors.lastSpinSeq = roulette.spinSeq;
            anchors.winnerShownAt = Date.now();
        }
        return;
    }

    if (tool === 'questions') return;

    const trends = state as TrendsOverlayState;
    if (trends.tracking) {
        anchors.trendsEndedAt = null;
        anchors.wasTracking = true;
        return;
    }
    if (anchors.wasTracking && trends.timerEnded && trends.sessionActive) {
        if (anchors.trendsEndedAt === null) {
            anchors.trendsEndedAt = Date.now();
        }
        anchors.wasTracking = false;
        return;
    }
    if (!trends.sessionActive || !trends.timerEnded) {
        anchors.trendsEndedAt = null;
        anchors.wasTracking = false;
    }
}

/**
 * Intervalo de poll del mirror OBS.
 * Rápido solo mientras hay sesión visible/activa; en reposo escucha cada 60s.
 */
export function resolveOverlayPollIntervalMs(
    tool: OverlayTool,
    state: AnyOverlayState | null,
    now: number,
    anchors: OverlayPollAnchors
): number {
    if (!state) return OVERLAY_POLL_IDLE_MS;

    if (tool === 'trends') {
        const trends = state as TrendsOverlayState;
        if (trends.tracking || shouldShowTrendsOverlay(trends, now, anchors.trendsEndedAt)) {
            return OVERLAY_POLL_TRENDS_MS;
        }
        return OVERLAY_POLL_IDLE_MS;
    }

    if (tool === 'questions') {
        return shouldShowQuestionsOverlay(state as QuestionsOverlayState)
            ? OVERLAY_POLL_QUESTIONS_MS
            : OVERLAY_POLL_IDLE_MS;
    }

    const roulette = state as RouletteOverlayState;
    if (roulette.isSpinning || shouldShowRouletteOverlay(roulette, now, anchors.winnerShownAt)) {
        if (roulette.isSpinning) return OVERLAY_POLL_SPINNING_MS;
        return OVERLAY_POLL_ROULETTE_MS;
    }

    return OVERLAY_POLL_IDLE_MS;
}

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

/** Visible con pregunta actual o mientras se escucha el chat (espera). */
export function shouldShowQuestionsOverlay(state: QuestionsOverlayState): boolean {
    return Boolean(state.current) || state.isActive;
}
