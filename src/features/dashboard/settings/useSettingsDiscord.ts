import { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import type { Session } from '@/core/config/config';
import { withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { writePanelSyncPref } from '@/features/dashboard/lib/dashboardSync';
import type { Translations } from '@/core/i18n/locales/es';
import type { DiscordResultKind } from '@/features/dashboard/settings/DiscordLinkModals';
import { settingsTabPath } from '@/features/dashboard/settings/settingsPaths';

type ShowToast = (message: string, type?: 'success' | 'error' | 'info' | 'warning' | 'loading') => unknown;

type SyncProfile = (options?: { silent?: boolean; fresh?: boolean }) => Promise<void>;

type UseSettingsDiscordParams = {
    session: Session;
    showToast: ShowToast;
    t: Translations;
    syncProfile: SyncProfile;
    onDiscordReturn: () => void;
};

export function useSettingsDiscord({
    session,
    showToast,
    t,
    syncProfile,
    onDiscordReturn
}: UseSettingsDiscordParams) {
    const [discordBusy, setDiscordBusy] = useState(false);
    const [discordLinkOpen, setDiscordLinkOpen] = useState(false);
    const [discordUnlinkOpen, setDiscordUnlinkOpen] = useState(false);
    const [discordResult, setDiscordResult] = useState<DiscordResultKind | null>(null);

    const sessionRef = useRef(session);
    sessionRef.current = session;
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;
    const syncProfileRef = useRef(syncProfile);
    syncProfileRef.current = syncProfile;
    const onDiscordReturnRef = useRef(onDiscordReturn);
    onDiscordReturnRef.current = onDiscordReturn;

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

        onDiscordReturnRef.current();
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
            void syncProfileRef.current({ silent: true, fresh: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con query
    }, []);

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

    return {
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
