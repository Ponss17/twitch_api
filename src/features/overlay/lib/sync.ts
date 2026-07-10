import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { debugWarn } from '@/core/logging/debugLog';
import type { OverlayTool, RouletteOverlayState, TrendsOverlayState } from '@/features/overlay/lib/types';
import { overlayStateFingerprint } from '@/features/overlay/lib/overlayStateUtils';

const lastPublishedFingerprint = new Map<OverlayTool, string>();

/** Omite PUT si el payload lógico no cambió (ahorra invocaciones serverless). */
export function resetOverlayPublishCache(tool?: OverlayTool): void {
    if (tool) lastPublishedFingerprint.delete(tool);
    else lastPublishedFingerprint.clear();
}

export async function publishOverlayState(
    tool: OverlayTool,
    state: RouletteOverlayState | TrendsOverlayState,
    session: Session
): Promise<void> {
    const fingerprint = overlayStateFingerprint(tool, state);
    if (lastPublishedFingerprint.get(tool) === fingerprint) return;

    // Reserva la huella antes del fetch para evitar PUT duplicados en vuelo
    // (p. ej. emitState explícito + useEffect de sync en el mismo tick).
    lastPublishedFingerprint.set(tool, fingerprint);

    try {
        const res = await fetch(`${API_ENDPOINTS.BASE}/dashboard/overlay-state/${tool}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ state }),
            cache: 'no-store'
        });
        if (!res.ok) {
            lastPublishedFingerprint.delete(tool);
            return;
        }
    } catch (err) {
        lastPublishedFingerprint.delete(tool);
        debugWarn('[overlay] publishOverlayState failed:', err);
    }
}

export async function fetchOverlayLink(
    tool: OverlayTool,
    session: Session
): Promise<string | null> {
    try {
        const res = await fetch(`${API_ENDPOINTS.BASE}/dashboard/overlay-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ tool })
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { url?: string };
        return data.url ?? null;
    } catch (err) {
        debugWarn('[overlay] fetchOverlayLink failed:', err);
        return null;
    }
}
