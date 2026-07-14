import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { bindCommandStoreUser } from '@/features/commands/lib/commandStore';
import {
    initAuthSync,
    validateSession,
    resolveSessionFromUrl,
    invalidateSession,
    mergeSessionFromValidate,
    getSession,
    resolveDegradedSession,
    stripSensitiveQueryParams,
    readOptimisticAuthState
} from '@/core/api/auth';
import type { Session } from '@/core/config/config';
import { appPath } from '@/core/config/paths';
import { SessionContext } from '@/core/session/context';
import { useToastOptional } from '@/shared/ui/ToastProvider';
import { reportSessionLoadProgress } from '@/core/session/loadProgress';
import { saveOverlayStoredSession, getOverlayStoredSession } from '@/features/overlay/lib/overlaySession';
import { useProactiveTokenRefresh } from '@/core/session/useProactiveTokenRefresh';

export type { SessionContextValue } from '@/core/session/context';

export interface SessionBootstrap {
    readOptimisticAuthState(): {
        session: Session | null;
        loading: boolean;
        authenticated: boolean;
    };
    resolveSessionFromUrl(): Promise<Session>;
    /** overlay: sessionStorage aislado del panel */
    storage?: 'local' | 'overlay';
}

const DEFAULT_SESSION_BOOTSTRAP: SessionBootstrap = {
    readOptimisticAuthState,
    resolveSessionFromUrl,
    storage: 'local'
};

interface SessionProviderProps {
    children: ReactNode;
    requireAuth?: boolean;
    bootstrap?: SessionBootstrap;
}

export function SessionProvider({
    children,
    requireAuth = false,
    bootstrap = DEFAULT_SESSION_BOOTSTRAP
}: SessionProviderProps) {
    const showToast = useToastOptional();
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    const optimistic = bootstrap.readOptimisticAuthState();
    const hydratedFromStorageRef = useRef(optimistic.authenticated);
    const [session, setSession] = useState<Session | null>(optimistic.session);
    const [loading, setLoading] = useState(optimistic.loading);
    const [authenticated, setAuthenticated] = useState(optimistic.authenticated);
    const redirectTimerRef = useRef<number | null>(null);

    useEffect(() => {
        initAuthSync();
    }, []);

    const refresh = useCallback(async () => {
        const skipInitialProgress = hydratedFromStorageRef.current;
        hydratedFromStorageRef.current = false;

        if (!skipInitialProgress) {
            reportSessionLoadProgress({
                progress: 8,
                label: 'Recuperando sesión…',
                cached: false
            });
        }

        const sessionParams = await bootstrap.resolveSessionFromUrl();

        if (!sessionParams.token && !sessionParams.apiKey && !sessionParams.overlayToken) {
            bindCommandStoreUser(undefined);
            unstable_batchedUpdates(() => {
                setSession(null);
                setLoading(false);
                setAuthenticated(false);
            });
            if (requireAuth) {
                window.location.href = appPath('/');
            }
            return;
        }

        let result;
        try {
            result = await validateSession(sessionParams);
        } catch {
            const stored =
                bootstrap.storage === 'overlay' ? getOverlayStoredSession() : getSession();
            if (stored?.apiKey || stored?.token || stored?.overlayToken) {
                result = { valid: true, error: true, networkError: true };
            } else {
                result = { valid: false, error: true };
            }
        }

        if (result.valid === true) {
            if (result.error) {
                showToastRef.current('Conexión inestable con el servidor', 'warning');
            }

            const baseSession = result.networkError
                ? bootstrap.storage === 'overlay'
                    ? { ...(getOverlayStoredSession() ?? {}), ...sessionParams }
                    : resolveDegradedSession(sessionParams)
                : sessionParams;
            const persistLocal = bootstrap.storage !== 'overlay';
            const enriched = mergeSessionFromValidate(baseSession, result, { persist: persistLocal });

            if (bootstrap.storage === 'overlay') {
                saveOverlayStoredSession(enriched);
            }

            bindCommandStoreUser(enriched.userId);

            if (sessionParams.isNewLogin) {
                stripSensitiveQueryParams({
                    keepOverlayToken: bootstrap.storage === 'overlay'
                });
            }

            if (
                sessionParams.apiKey &&
                enriched.apiKey &&
                enriched.apiKey !== sessionParams.apiKey
            ) {
                showToastRef.current('Tu API Key ha sido actualizada', 'info');
            }

            unstable_batchedUpdates(() => {
                setSession(enriched);
                setAuthenticated(true);
                setLoading(false);
            });
            reportSessionLoadProgress({
                progress: 58,
                label: 'Preparando panel…',
                cached: false
            });
            return;
        }

        bindCommandStoreUser(undefined);
        unstable_batchedUpdates(() => {
            setSession(null);
            setAuthenticated(false);
            setLoading(false);
        });

        if (requireAuth) {
            invalidateSession({ broadcast: false });
            if (bootstrap.storage === 'overlay') {
                showToastRef.current('Enlace de overlay inválido o expirado.', 'error');
                return;
            }
            showToastRef.current('Sesión expirada. Redirigiendo...', 'error');
            redirectTimerRef.current = window.setTimeout(() => {
                window.location.href = appPath('/');
            }, 2000);
        }
    }, [requireAuth, bootstrap]);

    useEffect(() => {
        void refresh();
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }
        };
    }, [refresh]);

    // Refresh proactivo: renueva el token de Twitch antes de que expire,
    // sin esperar a que una petición falle con 401.
    useProactiveTokenRefresh(session, refresh, authenticated);

    const value = useMemo(
        () => ({ session, loading, authenticated, refresh }),
        [session, loading, authenticated, refresh]
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
