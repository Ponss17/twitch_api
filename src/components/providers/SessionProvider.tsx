import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initAuthSync, saveSession, validateSession, parseUrlParams, clearSession } from '@/lib/auth';
import type { Session } from '@/lib/config';
import { appPath } from '@/lib/paths';
import { SessionContext } from '@/lib/sessionContext';
import { useToastOptional } from '@/components/ui/ToastProvider';

export type { SessionContextValue } from '@/lib/sessionContext';

function mergeValidatedSession(session: Session, result: Record<string, unknown>): Session {
    const merged: Session = { ...session };
    const apiKey = result.apiKey;
    if (typeof apiKey === 'string' && apiKey) merged.apiKey = apiKey;

    const user = result.user;
    if (user && typeof user === 'object') {
        const profile = user as Record<string, unknown>;
        if (typeof profile.login === 'string') merged.login = profile.login;
        if (typeof profile.display_name === 'string') merged.displayName = profile.display_name;
        if (typeof profile.profile_image_url === 'string') {
            merged.profile_image_url = profile.profile_image_url;
        }
        if (typeof profile.id === 'string') merged.userId = profile.id;
    }

    saveSession(merged);
    return merged;
}

interface SessionProviderProps {
    children: ReactNode;
    requireAuth?: boolean;
}

export function SessionProvider({ children, requireAuth = false }: SessionProviderProps) {
    const showToast = useToastOptional();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const redirectTimerRef = useRef<number | null>(null);

    useEffect(() => {
        initAuthSync();
    }, []);

    const refresh = useCallback(async () => {
        const sessionParams = parseUrlParams();

        if (!sessionParams.token && !sessionParams.apiKey) {
            setSession(null);
            setLoading(false);
            setAuthenticated(false);
            if (requireAuth) {
                window.location.href = appPath('/');
            }
            return;
        }

        let result;
        try {
            result = await validateSession(sessionParams);
        } catch {
            result = { valid: true, error: true };
        }

        if (result.valid === true) {
            if (result.error) {
                showToast('Conexión inestable con el servidor', 'warning');
            }

            const enriched = mergeValidatedSession(sessionParams, result as Record<string, unknown>);

            if (sessionParams.isNewLogin) {
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname + window.location.hash
                );
                saveSession(enriched);
            }

            if (
                sessionParams.apiKey &&
                enriched.apiKey &&
                enriched.apiKey !== sessionParams.apiKey
            ) {
                showToast('Tu API Key ha sido actualizada', 'info');
            }

            setSession(enriched);
            setAuthenticated(true);
            setLoading(false);
            return;
        }

        setSession(null);
        setAuthenticated(false);
        setLoading(false);

        if (requireAuth) {
            clearSession();
            showToast('Sesión expirada. Redirigiendo...', 'error');
            redirectTimerRef.current = window.setTimeout(() => {
                window.location.href = appPath('/');
            }, 2000);
        }
    }, [requireAuth, showToast]);

    useEffect(() => {
        void refresh();
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
                redirectTimerRef.current = null;
            }
        };
    }, [refresh]);

    const value = useMemo(
        () => ({ session, loading, authenticated, refresh }),
        [session, loading, authenticated, refresh]
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
