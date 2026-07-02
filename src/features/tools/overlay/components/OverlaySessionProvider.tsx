import type { ReactNode } from 'react';
import { SessionProvider } from '@/shared/providers/SessionProvider';
import {
    readOverlayOptimisticAuthState,
    resolveOverlaySessionFromUrl
} from '@/features/tools/overlay/lib/overlaySession';

const OVERLAY_SESSION_BOOTSTRAP = {
    readOptimisticAuthState: readOverlayOptimisticAuthState,
    resolveSessionFromUrl: resolveOverlaySessionFromUrl
};

interface OverlaySessionProviderProps {
    children: ReactNode;
    requireAuth?: boolean;
}

/** SessionProvider con bootstrap OBS — apiKey en URL solo en /overlay/*. */
export function OverlaySessionProvider({ children, requireAuth = false }: OverlaySessionProviderProps) {
    return (
        <SessionProvider requireAuth={requireAuth} bootstrap={OVERLAY_SESSION_BOOTSTRAP}>
            {children}
        </SessionProvider>
    );
}
