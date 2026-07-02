import type { Session } from '@/core/config/config';
import {
    getOverlayStoredSession,
    getOverlayTokenFromPage,
    readOverlayOptimisticAuthState
} from '@/features/tools/overlay/lib/overlaySession';

/** Credenciales unificadas para poll OBS (gate + mirror). */
export function resolveOverlayPollSession(): Session | null {
    const fromPage = getOverlayTokenFromPage();
    const stored = getOverlayStoredSession();
    const optimistic = readOverlayOptimisticAuthState();

    const overlayToken =
        fromPage?.trim() ||
        optimistic.session?.overlayToken?.trim() ||
        stored?.overlayToken?.trim() ||
        '';

    if (overlayToken) {
        return {
            ...(stored ?? optimistic.session ?? {}),
            overlayToken,
            login: stored?.login ?? optimistic.session?.login ?? '',
            displayName: stored?.displayName ?? optimistic.session?.displayName ?? ''
        };
    }

    if (stored?.apiKey || stored?.token) {
        return stored;
    }

    if (optimistic.session?.apiKey || optimistic.session?.token) {
        return optimistic.session;
    }

    return null;
}

export function hasOverlayPollCredentials(session: Session | null | undefined): boolean {
    return !!(session?.overlayToken || session?.apiKey || session?.token);
}

export function overlaySessionKey(session: Session | null | undefined): string {
    return `${session?.overlayToken ?? ''}|${session?.apiKey ?? ''}|${session?.token ?? ''}`;
}
