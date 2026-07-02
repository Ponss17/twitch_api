import { authHeaders } from '@/core/api/auth';
import type { Session } from '@/core/config/config';

/** Auth del cliente OBS — alineado con comandos de bot (x-api-key, no Bearer). */
export function overlayAuthHeaders(session: Session | null): Record<string, string> {
    return authHeaders(session, { preferApiKey: true });
}
