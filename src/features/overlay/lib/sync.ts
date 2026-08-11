import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { debugWarn } from '@/core/logging/debugLog';
import type { OverlayTool, RouletteOverlayState, TrendsOverlayState } from '@/features/overlay/lib/types';
import { overlayStateFingerprint } from '@/features/overlay/lib/overlayStateUtils';

type QueuedPublish = {
    state: RouletteOverlayState | TrendsOverlayState;
    session: Session;
    fingerprint: string;
    resolve: () => void;
    reject: (error: unknown) => void;
};

const lastPublishedFingerprint = new Map<OverlayTool, string>();
const publishQueues = new Map<OverlayTool, Promise<void>>();
const latestQueued = new Map<OverlayTool, QueuedPublish>();

/** Omite PUT si el payload lógico no cambió (ahorra invocaciones serverless). */
export function resetOverlayPublishCache(tool?: OverlayTool): void {
    if (tool) {
        lastPublishedFingerprint.delete(tool);
        latestQueued.delete(tool);
        publishQueues.delete(tool);
    } else {
        lastPublishedFingerprint.clear();
        latestQueued.clear();
        publishQueues.clear();
    }
}

async function drainOverlayQueue(tool: OverlayTool): Promise<void> {
    while (latestQueued.has(tool)) {
        const job = latestQueued.get(tool)!;
        latestQueued.delete(tool);

        // Coalesce updates queued in the same tick so only the newest ships.
        await Promise.resolve();
        if (latestQueued.has(tool)) {
            job.resolve();
            continue;
        }

        lastPublishedFingerprint.set(tool, job.fingerprint);
        try {
            const res = await fetch(`${API_ENDPOINTS.OVERLAY_STATE}${tool}`, withApiCredentials({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders(job.session) },
                body: JSON.stringify({ state: job.state }),
                cache: 'no-store'
            }));
            if (!res.ok && lastPublishedFingerprint.get(tool) === job.fingerprint) {
                lastPublishedFingerprint.delete(tool);
            }
            job.resolve();
        } catch (err) {
            if (lastPublishedFingerprint.get(tool) === job.fingerprint) {
                lastPublishedFingerprint.delete(tool);
            }
            debugWarn('[overlay] publishOverlayState failed:', err);
            job.reject(err);
        }
    }
    publishQueues.delete(tool);
}

export async function publishOverlayState(
    tool: OverlayTool,
    state: RouletteOverlayState | TrendsOverlayState,
    session: Session
): Promise<void> {
    const fingerprint = overlayStateFingerprint(tool, state);
    if (lastPublishedFingerprint.get(tool) === fingerprint && !latestQueued.has(tool)) return;

    return new Promise<void>((resolve, reject) => {
        const previous = latestQueued.get(tool);
        if (previous) previous.resolve();

        latestQueued.set(tool, { state, session, fingerprint, resolve, reject });

        if (publishQueues.has(tool)) return;

        const drain = drainOverlayQueue(tool);
        publishQueues.set(tool, drain);
        void drain;
    });
}

export async function fetchOverlayLink(
    tool: OverlayTool,
    session: Session
): Promise<string | null> {
    try {
        const res = await fetch(API_ENDPOINTS.OVERLAY_LINK, withApiCredentials({
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
            body: JSON.stringify({ tool })
        }));
        if (res.ok) {
            const data = (await res.json()) as { url?: string };
            if (data.url) return data.url;
        }
    } catch (err) {
        debugWarn('[overlay] fetchOverlayLink failed:', err);
    }

    // Fallback elegante para entorno local si el backend no está disponible
    if (typeof window !== 'undefined') {
        const base = `${window.location.origin}/overlay/${tool}`;
        return session.apiKey ? `${base}?key=${encodeURIComponent(session.apiKey)}` : base;
    }
    return null;
}
