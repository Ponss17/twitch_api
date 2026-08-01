import { useMemo, type ReactNode } from 'react';
import type { Session } from '@/core/config/config';
import { OverlayStatusBanner } from '@/features/overlay/components/OverlayStatusBanner';
import {
    hasOverlayPollCredentials,
    resolveOverlayPollSession
} from '@/features/overlay/lib/credentials';
import { readOverlayOptimisticAuthState } from '@/features/overlay/lib/overlaySession';
import { useTranslation } from '@/core/i18n/I18nContext';

interface OverlaySessionGateProps {
    children: (session: Session) => ReactNode;
}

/**
 * Credenciales OBS sin useSession — evita fallos si Astro/Vite parten el árbol
 * o el navegador de OBS sirve chunks JS en caché sin SessionProvider.
 */
export function OverlaySessionGate({ children }: OverlaySessionGateProps) {
    const { t } = useTranslation();
    const gT = t.overlay.gate;
    const bT = t.overlay.banners;
    const session = useMemo(() => resolveOverlayPollSession(), []);

    if (session && hasOverlayPollCredentials(session)) {
        return <>{children(session)}</>;
    }

    const optimistic = readOverlayOptimisticAuthState();
    if (optimistic.loading) {
        return (
            <div className="min-h-screen p-2">
                <OverlayStatusBanner message={bT.connecting} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-2">
            <OverlayStatusBanner message={gT.invalidLink} />
        </div>
    );
}
