import { authHeaders } from '@/core/api/auth';
import type { Session } from '@/core/config/config';

export function overlayAuthHeaders(session: Session | null): Record<string, string> {
    if (session?.overlayToken) {
        return { 'x-overlay-token': session.overlayToken };
    }
    return authHeaders(session, { preferApiKey: true });
}
