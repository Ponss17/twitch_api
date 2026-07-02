import type { ReactNode } from 'react';
import { useSession } from '@/core/session/useSession';
import { OverlayStatusBanner } from '@/features/tools/overlay/components/OverlayStatusBanner';

interface OverlaySessionGateProps {
    children: (session: NonNullable<ReturnType<typeof useSession>['session']>) => ReactNode;
}

/** Espera la sesión antes de montar el mirror (evita crash en OBS al cargar ?auth=). */
export function OverlaySessionGate({ children }: OverlaySessionGateProps) {
    const { session, loading } = useSession();

    if (loading || !session) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message="Conectando overlay…" />
            </div>
        );
    }

    return <>{children(session)}</>;
}
