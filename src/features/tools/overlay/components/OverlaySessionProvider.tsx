import type { ReactNode } from 'react';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import {
    readOverlayOptimisticAuthState,
    resolveOverlaySessionFromUrl
} from '@/features/tools/overlay/lib/overlaySession';

const OVERLAY_SESSION_BOOTSTRAP = {
    readOptimisticAuthState: readOverlayOptimisticAuthState,
    resolveSessionFromUrl: resolveOverlaySessionFromUrl,
    storage: 'overlay' as const
};

interface OverlaySessionProviderProps {
    children: ReactNode;
    requireAuth?: boolean;
}

/** SessionProvider con bootstrap OBS — overlayToken en URL (sin API key maestra). */
export function OverlaySessionProvider({ children, requireAuth = false }: OverlaySessionProviderProps) {
    return (
        <SessionProvider requireAuth={requireAuth} bootstrap={OVERLAY_SESSION_BOOTSTRAP}>
            {children}
        </SessionProvider>
    );
}
