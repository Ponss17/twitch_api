import { useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import type { Session } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import {
    broadcastHomeDataReset,
    clearDashboardSyncPrefs,
    writePanelSyncPref
} from '@/features/dashboard/lib/dashboardSync';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { appPath } from '@/core/config/paths';
import type { Translations } from '@/core/i18n/locales/es';
import type { ClearDataScopes, SettingsDangerModal } from '@/features/dashboard/settings/settingsTypes';

const DEFAULT_CLEAR_SCOPES: ClearDataScopes = { stats: true, questions: true };

async function parseJsonSafe(res: Response): Promise<Record<string, unknown>> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return {};
    try {
        return (await res.json()) as Record<string, unknown>;
    } catch {
        return {};
    }
}

type ShowToast = (message: string, type?: 'success' | 'error' | 'info' | 'warning' | 'loading') => unknown;

type UseSettingsDangerActionsParams = {
    session: Session;
    showToast: ShowToast;
    t: Translations;
    onDataCleared?: () => void;
};

export function useSettingsDangerActions({ session, showToast, t, onDataCleared }: UseSettingsDangerActionsParams) {
    const [dangerModal, setDangerModal] = useState<SettingsDangerModal | null>(null);
    const clearScopesRef = useRef<ClearDataScopes>(DEFAULT_CLEAR_SCOPES);

    const clearData = async () => {
        const scopes = clearScopesRef.current;
        try {
            const res = await fetchWithRetry(
                API_ENDPOINTS.CLEAR_DATA,
                withApiCredentials({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders(session) },
                    body: JSON.stringify({ confirm: 'LIMPIAR', scopes })
                })
            );
            const data = await parseJsonSafe(res);
            if (res.ok && data.success) {
                const cleared = (data.cleared as ClearDataScopes | undefined) ?? scopes;
                if (cleared.stats) {
                    clearDashboardSyncPrefs(session.userId);
                    if (session.userId) broadcastHomeDataReset(session.userId);
                }
                writePanelSyncPref(session.userId, Date.now().toString());
                onDataCleared?.();
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

    const openClearDataModal = () => {
        const scopes = { ...DEFAULT_CLEAR_SCOPES };
        clearScopesRef.current = scopes;
        setDangerModal({
            title: t.settings.dangerModals.resetTitle,
            desc: t.settings.dangerModals.resetDesc,
            word: t.settings.dangerModals.resetWord,
            confirmLabel: t.settings.dangerModals.resetConfirm,
            clearScopes: scopes,
            onClearScopesChange: (next) => {
                clearScopesRef.current = next;
                setDangerModal((prev) => (prev ? { ...prev, clearScopes: next } : prev));
            },
            action: clearData
        });
    };

    const openDeleteAccountModal = () =>
        setDangerModal({
            title: t.settings.dangerModals.deleteTitle,
            desc: t.settings.dangerModals.deleteDesc,
            word: t.settings.dangerModals.deleteWord,
            confirmLabel: t.settings.dangerModals.deleteConfirm,
            action: deleteAccount
        });

    return {
        dangerModal,
        setDangerModal,
        openClearDataModal,
        openDeleteAccountModal
    };
}
