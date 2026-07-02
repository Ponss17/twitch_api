import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import type { OverlayTool, RouletteOverlayState, TrendsOverlayState } from '@/features/tools/overlay/lib/types';
import { overlayStateFingerprint } from '@/features/tools/overlay/lib/overlayStateUtils';

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
    lastPublishedFingerprint.set(tool, fingerprint);

    try {
        await fetch(`${API_ENDPOINTS.BASE}/dashboard/overlay-state/${tool}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ state })
        });
    } catch {
        lastPublishedFingerprint.delete(tool);
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
    } catch {
        return null;
    }
}
