import type { Session } from '@/core/config/config';
import {
    getOverlayStoredSession,
    getOverlayTokenFromPage,
    readOverlayOptimisticAuthState
} from '@/features/overlay/lib/overlaySession';

/** Credenciales unificadas para poll OBS (gate + mirror). Solo overlayToken. */
export function resolveOverlayPollSession(): Session | null {
    const fromPage = getOverlayTokenFromPage();
    const stored = getOverlayStoredSession();
    const optimistic = readOverlayOptimisticAuthState();

    const overlayToken =
        fromPage?.trim() ||
        optimistic.session?.overlayToken?.trim() ||
        stored?.overlayToken?.trim() ||
        '';

    if (!overlayToken) return null;

    return {
        ...(stored ?? optimistic.session ?? {}),
        overlayToken,
        login: stored?.login ?? optimistic.session?.login ?? '',
        displayName: stored?.displayName ?? optimistic.session?.displayName ?? ''
    };
}

export function hasOverlayPollCredentials(session: Session | null | undefined): boolean {
    return !!session?.overlayToken;
}

export function overlaySessionKey(session: Session | null | undefined): string {
    return session?.overlayToken ?? '';
}
