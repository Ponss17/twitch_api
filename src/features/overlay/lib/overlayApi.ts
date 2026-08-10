import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import type { OverlayTool } from '@/features/overlay/lib/types';

export function overlayAuthHeaders(session: Session | null): Record<string, string> {
    if (session?.overlayToken) {
        return { 'x-overlay-token': session.overlayToken };
    }
    return authHeaders(session, { preferApiKey: true });
}

/** URL de poll GET — query overlayToken como respaldo (OBS / pruebas en consola). */
export function overlayStatePollUrl(tool: OverlayTool, session: Session | null): string {
    const base = `${API_ENDPOINTS.OVERLAY_STATE}${tool}`;
    if (!session?.overlayToken) return base;
    return `${base}?overlayToken=${encodeURIComponent(session.overlayToken)}`;
}
