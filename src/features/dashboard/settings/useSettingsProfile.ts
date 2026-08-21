import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@/core/config/config';
import { fetchDashboardProfile, type DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import {
    PROFILE_POLL_MS,
    readPanelSyncPref,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';
import type { Translations } from '@/core/i18n/locales/es';

type ShowToast = (message: string, type?: 'success' | 'error' | 'info' | 'warning' | 'loading') => unknown;

type UseSettingsProfileParams = {
    active: boolean;
    session: Session;
    panelProfile: DashboardProfile | null;
    updateProfile: (profile: DashboardProfile | null) => void;
    showToast: ShowToast;
    t: Translations;
};

export function useSettingsProfile({
    active,
    session,
    panelProfile,
    updateProfile,
    showToast,
    t
}: UseSettingsProfileParams) {
    const [profile, setProfile] = useState<DashboardProfile | null>(() => panelProfile);
    const [loading, setLoading] = useState(() => !panelProfile);

    const pollRef = useRef<number | null>(null);
    const profileRef = useRef(profile);
    profileRef.current = profile;
    const sessionRef = useRef(session);
    sessionRef.current = session;
    const panelProfileRef = useRef(panelProfile);
    panelProfileRef.current = panelProfile;
    const updateProfileRef = useRef(updateProfile);
    updateProfileRef.current = updateProfile;
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const profileLoadRef = useRef<{ generation: number; controller: AbortController | null }>({
        generation: 0,
        controller: null
    });

    const syncProfile = useCallback(async (options?: { silent?: boolean; fresh?: boolean }) => {
        const currentSession = sessionRef.current;
        profileLoadRef.current.controller?.abort();
        const controller = new AbortController();
        const generation = profileLoadRef.current.generation + 1;
        profileLoadRef.current = { generation, controller };
        if (!currentSession.login) {
            setLoading(false);
            return;
        }
        if (!options?.silent && !profileRef.current) setLoading(true);
        try {
            const data = await fetchDashboardProfile(currentSession, {
                fresh: options?.fresh,
                signal: controller.signal
            });
            if (
                controller.signal.aborted ||
                profileLoadRef.current.generation !== generation ||
                sessionRef.current.userId !== currentSession.userId
            ) return;
            setProfile(data);
            updateProfileRef.current(data);
            writePanelSyncPref(currentSession.userId, Date.now().toString());
        } catch (error) {
            if (controller.signal.aborted || (error as Error).name === 'AbortError') return;
            showToastRef.current(t.settings.toasts.profileError, 'error');
        } finally {
            if (profileLoadRef.current.generation === generation) {
                profileLoadRef.current.controller = null;
                setLoading(false);
            }
        }
    // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (!panelProfile) return;
        setProfile((prev) => {
            const incoming = panelProfile;
            if (!prev) return incoming;
            // Spread respeta null (p. ej. Discord desvinculado); no usar ?? que lo ignoraría.
            // No pisar fechas de ingreso si el summary aún no las trae.
            const next = { ...prev, ...incoming };
            if (incoming.dbCreatedAt == null && prev.dbCreatedAt != null) {
                next.dbCreatedAt = prev.dbCreatedAt;
            }
            if (incoming.dbLastActive == null && prev.dbLastActive != null) {
                next.dbLastActive = prev.dbLastActive;
            }
            return next;
        });
        setLoading(false);
    }, [panelProfile]);

    useEffect(() => {
        return () => {
            profileLoadRef.current.controller?.abort();
            profileLoadRef.current.generation++;
        };
    }, []);

    useEffect(() => {
        if (!active) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            return;
        }

        const pollMs = PROFILE_POLL_MS;
        const userId = sessionRef.current.userId;
        const lastSyncRaw = readPanelSyncPref(userId);
        const elapsed = lastSyncRaw ? Date.now() - parseInt(lastSyncRaw, 10) : Number.POSITIVE_INFINITY;
        const hasFreshPanelProfile = Boolean(panelProfileRef.current) && elapsed < pollMs;

        if (!hasFreshPanelProfile) {
            void syncProfile({
                silent: Boolean(panelProfileRef.current || profileRef.current),
                fresh: true
            });
        } else {
            setLoading(false);
        }

        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            const since = Date.now() - parseInt(readPanelSyncPref(sessionRef.current.userId) || '0', 10);
            if (since >= pollMs) {
                void syncProfile({ silent: true, fresh: true });
            }
        }, pollMs);

        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
        // No reiniciar el poll por identidad de session/panelProfile (refs).
    }, [session.login, active, syncProfile]);

    return {
        profile,
        loading,
        syncProfile
    };
}
