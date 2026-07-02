import type { ReactNode } from 'react';
import type { Session } from '@/core/config/config';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';
import {
    getOverlayStoredSession,
    getOverlayTokenFromPage,
    readOverlayOptimisticAuthState
} from '@/features/tools/overlay/lib/overlaySession';

interface OverlaySessionGateProps {
    children: (session: Session) => ReactNode;
}

function resolveOverlayPollSession(): Session | null {
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

/**
 * Credenciales OBS sin useSession — evita fallos si Astro/Vite parten el árbol
 * o el navegador de OBS sirve chunks JS en caché sin SessionProvider.
 */
export function OverlaySessionGate({ children }: OverlaySessionGateProps) {
    const session = resolveOverlayPollSession();

    if (session?.overlayToken || session?.apiKey || session?.token) {
        return <>{children(session)}</>;
    }

    const optimistic = readOverlayOptimisticAuthState();
    if (optimistic.loading) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message="Conectando overlay…" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-2">
            <OverlayStatusBanner message="Enlace de overlay inválido. Genera uno nuevo desde el panel." />
        </div>
    );
}
