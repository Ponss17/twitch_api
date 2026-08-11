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
import { writePanelSyncPref } from '@/features/dashboard/lib/dashboardSync';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { useRequiredSession, useSession } from '@/core/session/useSession';
import { maskApiKey } from '@/core/utils/utils';
import { useToast } from '@/shared/ui/ToastProvider';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';
import { copyText } from '@/core/utils/clipboard';
import {
    isSettingsTabId,
    parseSettingsTabFromLocation,
    readInitialSettingsTab,
    rememberSettingsTab,
    writeSettingsTabUrl,
    SETTINGS_TAB_STORAGE_KEY,
    type SettingsTabId
} from '@/features/dashboard/settings/settingsPaths';
import type { ClearDataScopes, SettingsDangerModal } from '@/features/dashboard/settings/settingsTypes';
import { useSettingsDangerActions } from '@/features/dashboard/settings/useSettingsDangerActions';
import { useSettingsDiscord } from '@/features/dashboard/settings/useSettingsDiscord';
import { useSettingsProfile } from '@/features/dashboard/settings/useSettingsProfile';
import { useTranslation } from '@/core/i18n/I18nContext';

export type { ClearDataScopes, SettingsDangerModal };

export function useSettingsController(active: boolean) {
    const session = useRequiredSession();
    const { refresh } = useSession();
    const { showToast } = useToast();
    const { t, locale } = useTranslation();
    const { profile: panelProfile, updateProfile } = useDashboardPanel();
    const {
        dangerModal,
        setDangerModal,
        openClearDataModal,
        openDeleteAccountModal
    } = useSettingsDangerActions({ session, showToast, t });

    const { profile, loading, syncProfile } = useSettingsProfile({
        active,
        session,
        panelProfile,
        updateProfile,
        showToast,
        t
    });

    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [keyVisible, setKeyVisible] = useState(false);
    const [settingsTab, setSettingsTab] = useState<SettingsTabId>(readInitialSettingsTab);
    const [regenOpen, setRegenOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const keyHideTimerRef = useRef<number | null>(null);

    const {
        discordBusy,
        discordLinkOpen,
        setDiscordLinkOpen,
        discordUnlinkOpen,
        setDiscordUnlinkOpen,
        discordResult,
        setDiscordResult,
        startDiscordLink,
        unlinkDiscord
    } = useSettingsDiscord({
        session,
        showToast,
        t,
        syncProfile,
        onDiscordReturn: () => {
            setSettingsTab('conexiones');
            rememberSettingsTab('conexiones');
        }
    });

    const changeSettingsTab = useCallback((tab: SettingsTabId) => {
        setSettingsTab(tab);
        rememberSettingsTab(tab);
        writeSettingsTabUrl(tab, { replace: false });
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
        return () => {
            if (keyHideTimerRef.current) window.clearTimeout(keyHideTimerRef.current);
        };
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

    const onPreferencesChanged = () => {
        writePanelSyncPref(session.userId, '0');
        void syncProfile({ silent: true, fresh: true });
    };

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
