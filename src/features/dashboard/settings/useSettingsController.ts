import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import {
    authHeaders,
    withApiCredentials,
    fetchRevealApiKey,
    clearRevealedApiKeyCache,
    cacheRevealedApiKey
} from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { fetchDashboardProfile, type DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import {
    broadcastHomeDataReset,
    clearDashboardSyncPrefs,
    PROFILE_POLL_MS,
    readPanelSyncPref,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { useRequiredSession, useSession } from '@/core/session/useSession';
import { maskApiKey } from '@/core/utils/utils';
import { appPath } from '@/core/config/paths';
import { useToast } from '@/shared/ui/ToastProvider';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import type { DiscordResultKind } from '@/features/dashboard/settings/DiscordLinkModals';
import { copyText } from '@/core/utils/clipboard';
import {
    isSettingsTabId,
    parseSettingsTabFromLocation,
    readInitialSettingsTab,
    rememberSettingsTab,
    settingsTabPath,
    writeSettingsTabUrl,
    SETTINGS_TAB_STORAGE_KEY,
    type SettingsTabId
} from '@/features/dashboard/settings/settingsPaths';
import type { SettingsDangerModal } from '@/features/dashboard/settings/settingsTypes';
import { useTranslation } from '@/core/i18n/I18nContext';

export type { SettingsDangerModal };

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return {};
    try {
        return (await res.json()) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export function useSettingsController(active: boolean) {
    const session = useRequiredSession();
    const { refresh } = useSession();
    const { showToast } = useToast();
    const { t, locale } = useTranslation();
    const { profile: panelProfile, updateProfile } = useDashboardPanel();

    const [profile, setProfile] = useState<DashboardProfile | null>(
        () => (panelProfile as DashboardProfile | null) ?? null
    );
    const [loading, setLoading] = useState(() => !panelProfile);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [keyVisible, setKeyVisible] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTabId>(readInitialSettingsTab);
    const [regenOpen, setRegenOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [discordBusy, setDiscordBusy] = useState(false);
    const [discordLinkOpen, setDiscordLinkOpen] = useState(false);
    const [discordUnlinkOpen, setDiscordUnlinkOpen] = useState(false);
    const [discordResult, setDiscordResult] = useState<DiscordResultKind | null>(null);
    const [dangerModal, setDangerModal] = useState<SettingsDangerModal | null>(null);

    const keyHideTimerRef = useRef<number | null>(null);
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

    const changeSettingsTab = useCallback((tab: SettingsTabId) => {
        setSettingsTab(tab);
        rememberSettingsTab(tab);
        writeSettingsTabUrl(tab, { replace: false });
    }, []);

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

    // Keep-alive / popstate: alinear sub-pestaña con el path.
    useEffect(() => {
        if (!active || typeof window === 'undefined') return;

        const syncFromLocation = () => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('discord')) {
                setSettingsTab('conexiones');
                rememberSettingsTab('conexiones');
                return;
            }
            const fromPath = parseSettingsTabFromLocation();
            if (fromPath) {
                setSettingsTab(fromPath);
                rememberSettingsTab(fromPath);
                if (params.has('s')) writeSettingsTabUrl(fromPath);
                return;
            }
            try {
                const stored = sessionStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
                if (isSettingsTabId(stored)) {
                    setSettingsTab(stored);
                    writeSettingsTabUrl(stored);
                }
            } catch {
                /* ignore */
            }
        };

        syncFromLocation();
        window.addEventListener('popstate', syncFromLocation);
        return () => window.removeEventListener('popstate', syncFromLocation);
    }, [active]);

    useEffect(() => {
        if (!panelProfile) return;
        setProfile((prev) => {
            const incoming = panelProfile as DashboardProfile;
            if (!prev) return incoming;
            // Spread respeta null (p. ej. Discord desvinculado); no usar ?? que lo ignoraría.
            return { ...prev, ...incoming };
        });
        setLoading(false);
    }, [panelProfile]);

    useEffect(() => {
        return () => {
            if (keyHideTimerRef.current) window.clearTimeout(keyHideTimerRef.current);
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
            void syncProfile({ silent: Boolean(panelProfileRef.current || profileRef.current) });
        } else {
            setLoading(false);
        }

        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            const since = Date.now() - parseInt(readPanelSyncPref(sessionRef.current.userId) || '0', 10);
            if (since >= pollMs) {
                void syncProfile({ silent: true });
            }
        }, pollMs);

        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
        // No reiniciar el poll por identidad de session/panelProfile (refs).
    }, [session.login, active, syncProfile]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const discord = params.get('discord');
        if (!discord) return;

        const known: DiscordResultKind[] = [
            'linked',
            'error_taken',
            'error_auth',
            'error_config',
            'error'
        ];
        const kind = (known.includes(discord as DiscordResultKind)
            ? discord
            : 'error') as DiscordResultKind;

        setSettingsTab('conexiones');
        rememberSettingsTab('conexiones');
        setDiscordResult(kind);
        showToastRef.current(
            kind === 'linked'
                ? t.settings.toasts.discordLinkSuccess
                : kind === 'error_taken'
                  ? t.settings.toasts.discordLinkTaken
                  : kind === 'error_auth'
                    ? t.settings.toasts.discordLinkAuth
                    : kind === 'error_config'
                      ? t.settings.toasts.discordLinkConfig
                      : t.settings.toasts.discordLinkError,
            kind === 'linked' ? 'success' : 'error'
        );

        params.delete('discord');
        params.delete('s');
        const path = settingsTabPath('conexiones');
        const qs = params.toString();
        window.history.replaceState({}, '', `${path}${qs ? `?${qs}` : ''}${window.location.hash}`);

        if (kind === 'linked') {
            writePanelSyncPref(sessionRef.current.userId, '0');
            void syncProfile({ silent: true, fresh: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con query
    }, []);

    const scheduleKeyHide = () => {
        if (keyHideTimerRef.current) clearTimeout(keyHideTimerRef.current);
        keyHideTimerRef.current = window.setTimeout(() => {
            setKeyVisible(false);
            setRevealedKey(null);
            clearRevealedApiKeyCache();
        }, 30000);
    };

    const regenerateKey = async () => {
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.REGENERATE_KEY,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                })
            );

            if (res.status === 403) {
                showToast(t.settings.toasts.invalidSession, 'error');
                return;
            }
            if (!res.ok) {
                showToast(t.settings.toasts.regenError, 'error');
                return;
            }

            const data = (await res.json()) as { apiKey?: string };
            if (data.apiKey) {
                clearRevealedApiKeyCache();
                cacheRevealedApiKey({
                    apiKey: data.apiKey,
                    masked: maskApiKey(data.apiKey)
                });
                setRevealedKey(data.apiKey);
                setKeyVisible(true);
                scheduleKeyHide();
                showToast(t.settings.toasts.regenSuccess, 'success');
                void refresh();
            }
        } catch {
            showToast(t.settings.toasts.regenError, 'error');
        }
    };

    const revealKeyTemporarily = async () => {
        try {
            const result = await fetchRevealApiKey();
            setRevealedKey(result.apiKey);
            setKeyVisible(true);
            scheduleKeyHide();
        } catch (e) {
            showToast((e as Error).message || 'No se pudo revelar la API Key', 'error');
        }
    };

    const toggleKeyVisibility = () => {
        if (keyVisible) {
            setKeyVisible(false);
            setRevealedKey(null);
            clearRevealedApiKeyCache();
        } else {
            void revealKeyTemporarily();
        }
    };

    const clearData = async () => {
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.CLEAR_DATA,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                    body: JSON.stringify({ confirm: 'LIMPIAR' })
                })
            );
            const data = await parseJsonSafe(res);
            if (res.ok && data.success) {
                clearDashboardSyncPrefs(session.userId);
                if (session.userId) broadcastHomeDataReset(session.userId);
                writePanelSyncPref(session.userId, Date.now().toString());
                showToast((data.message as string) ?? t.settings.toasts.clearSuccess, 'success');
            } else {
                showToast(extractApiErrorMessage(data, t.settings.toasts.clearError), 'error');
            }
        } catch {
            showToast(t.settings.toasts.clearError, 'error');
        }
    };

    const deleteAccount = async () => {
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.DELETE_ACCOUNT,
                withApiCredentials({
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                    body: JSON.stringify({ confirm: 'ELIMINAR' })
                })
            );
            const data = await parseJsonSafe(res);
            if (res.ok && data.success) {
                showToast(t.settings.toasts.deleteSuccess, 'success');
                setTimeout(() => {
                    window.location.href = appPath('/');
                }, 2000);
            } else {
                showToast(extractApiErrorMessage(data, t.settings.toasts.deleteError), 'error');
            }
        } catch {
            showToast(t.settings.toasts.deleteError, 'error');
        }
    };

    const copyKey = async () => {
        try {
            const key = revealedKey || (await fetchRevealApiKey()).apiKey;
            setRevealedKey(key);
            setKeyVisible(true);
            scheduleKeyHide();
            const ok = await copyText(key);
            if (ok) {
                showToast(t.settings.toasts.copyKeySuccess, 'success');
            } else {
                showToast(t.settings.toasts.copyKeyError, 'error');
            }
        } catch {
            showToast(t.settings.toasts.copyKeyError, 'error');
        }
    };

    const copyId = async () => {
        if (!session.userId) return;
        const ok = await copyText(session.userId);
        if (ok) showToast(t.settings.toasts.copyIdSuccess, 'success');
    };

    const exportData = async () => {
        setExportLoading(true);
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.EXPORT_CHECK,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                })
            );

            if (res.status === 429) {
                const data = (await res.json()) as { error?: string };
                showToast(
                    extractApiErrorMessage(data, t.settings.toasts.exportLimitError),
                    'warning'
                );
                return;
            }
            if (!res.ok) {
                showToast(t.settings.toasts.limitError, 'error');
                return;
            }
            const { DataExport } = await import('@/features/dashboard/lib/dataExporter');
            await DataExport.export(session, t, locale, (msg) => showToast(msg, 'success'));

            await fetchWithRetry(
                API_ENDPOINTS.EXPORT_COMPLETE,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) }
                })
            );
        } catch {
            showToast(t.settings.toasts.connectionError, 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const startDiscordLink = () => {
        setDiscordLinkOpen(false);
        window.location.href = API_ENDPOINTS.AUTH_DISCORD_LINK;
    };

    const unlinkDiscord = async () => {
        setDiscordBusy(true);
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.AUTH_DISCORD_UNLINK,
                withApiCredentials({ method: 'POST' })
            );
            if (!res.ok) {
                setDiscordResult('error');
                showToast(t.settings.toasts.discordUnlinkError, 'error');
                return;
            }
            setDiscordResult('unlinked');
            showToast(t.settings.toasts.discordUnlinkSuccess, 'success');
            await syncProfile({ silent: true, fresh: true });
        } catch {
            setDiscordResult('error');
            showToast(t.settings.toasts.discordUnlinkError, 'error');
        } finally {
            setDiscordBusy(false);
        }
    };

    const onPreferencesChanged = () => {
        writePanelSyncPref(session.userId, '0');
        void syncProfile({ silent: true, fresh: true });
    };

    const openClearDataModal = () =>
        setDangerModal({
            title: t.settings.dangerModals.resetTitle,
            desc: t.settings.dangerModals.resetDesc,
            word: t.settings.dangerModals.resetWord,
            confirmLabel: t.settings.dangerModals.resetConfirm,
            action: clearData
        });

    const openDeleteAccountModal = () =>
        setDangerModal({
            title: t.settings.dangerModals.deleteTitle,
            desc: t.settings.dangerModals.deleteDesc,
            word: t.settings.dangerModals.deleteWord,
            confirmLabel: t.settings.dangerModals.deleteConfirm,
            action: deleteAccount
        });

    return {
        session,
        profile,
        loading,
        settingsTab,
        changeSettingsTab,
        exportLoading,
        exportData,
        copyId,
        onPreferencesChanged,
        apiKeyDisplay:
            keyVisible && revealedKey ? revealedKey : maskApiKey(revealedKey || '••••••••••••••••'),
        keyVisible,
        toggleKeyVisibility,
        copyKey,
        setRegenOpen,
        regenOpen,
        regenerateKey,
        openClearDataModal,
        openDeleteAccountModal,
        dangerModal,
        setDangerModal,
        discordBusy,
        discordLinkOpen,
        setDiscordLinkOpen,
        discordUnlinkOpen,
        setDiscordUnlinkOpen,
        discordResult,
        setDiscordResult,
        startDiscordLink,
        unlinkDiscord
    };
}
