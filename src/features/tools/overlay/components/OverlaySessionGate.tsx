import type { ReactNode } from 'react';
import { useSession } from '@/core/session/useSession';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';

interface OverlaySessionGateProps {
    children: (session: NonNullable<ReturnType<typeof useSession>['session']>) => ReactNode;
}

function hasOverlayCredentials(session: ReturnType<typeof useSession>['session']): boolean {
    return !!(session?.overlayToken || session?.apiKey || session?.token);
}

/** Espera credenciales antes de montar el mirror (OBS: token en URL o sessionStorage). */
export function OverlaySessionGate({ children }: OverlaySessionGateProps) {
    const { session, loading, authenticated } = useSession();

    const urlToken =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('overlayToken')?.trim()
            : '';

    if (urlToken) {
        const pollSession = session ?? { overlayToken: urlToken, login: '', displayName: '' };
        return <>{children(pollSession)}</>;
    }

    if (loading && !hasOverlayCredentials(session)) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message="Conectando overlay…" />
            </div>
        );
    }

    if (!hasOverlayCredentials(session)) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message="Enlace de overlay inválido. Genera uno nuevo desde el panel." />
            </div>
        );
    }

    if (!authenticated && !hasOverlayCredentials(session)) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message="Sesión de overlay expirada. Actualiza la URL en OBS." />
            </div>
        );
    }

    return <>{children(session!)}</>;
}
