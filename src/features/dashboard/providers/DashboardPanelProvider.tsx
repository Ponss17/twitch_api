import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Session } from '@/core/config/config';
import type { DashboardProfile } from '@/features/dashboard/lib/data/dashboardSummary';
import { useDashboardPanelState } from './hooks/useDashboardPanelState';
import { useDashboardPanelEngine } from './hooks/useDashboardPanelEngine';
import type { DashboardLiveStats } from '@/features/dashboard/lib/data/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/logs/activityLogDisplay';
import { useTranslation } from '@/core/i18n/I18nContext';

export interface DashboardPanelContextValue {
    stats: DashboardLiveStats;
    activity: ActivityLogItem[];
    profile: DashboardProfile | null;
    updateProfile: (profile: DashboardProfile | null) => void;
    hasLiveData: boolean;
    error: string | null;
    syncing: boolean;
    syncLabel: string;
    highlightKeys: ReadonlySet<string>;
    isRealtimeLive: boolean;
    refreshPanel: () => Promise<void>;
}

const DashboardPanelContext = createContext<DashboardPanelContextValue | null>(null);

export function useDashboardPanel(): DashboardPanelContextValue {
    const ctx = useContext(DashboardPanelContext);
    if (!ctx) {
        throw new Error('useDashboardPanel debe usarse dentro de DashboardPanelProvider');
    }
    return ctx;
}

export function useOptionalDashboardPanel(): DashboardPanelContextValue | null {
    return useContext(DashboardPanelContext);
}

interface DashboardPanelProviderProps {
    active: boolean;
    prioritySync?: boolean;
    session: Session;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    children: ReactNode;
}

export function DashboardPanelProvider({
    active,
    prioritySync = true,
    session,
    showToast,
    children
}: DashboardPanelProviderProps) {
    const { t } = useTranslation();
    const { state, actions, refs } = useDashboardPanelState(session);

    const { refreshPanel } = useDashboardPanelEngine({
        active,
        prioritySync,
        session,
        showToast,
        state,
        actions,
        refs,
        labels: {
            syncing: t.common.sessionLoad.syncing,
            realtime: t.common.sessionLoad.realtime,
            fetchingPanelStats: t.common.sessionLoad.fetchingPanelStats,
            preparingHome: t.common.sessionLoad.preparingHome
        }
    });

    const value = useMemo<DashboardPanelContextValue>(
        () => ({
            stats: state.stats,
            activity: state.activity,
            profile: state.profile as DashboardProfile | null,
            updateProfile: actions.setProfile,
            hasLiveData: state.hasLiveData,
            error: state.error,
            syncing: state.syncing,
            syncLabel: state.syncLabel,
            highlightKeys: state.highlightKeys,
            isRealtimeLive: state.isRealtimeLive,
            refreshPanel
        }),
        [
            state.stats,
            state.activity,
            state.profile,
            actions.setProfile,
            state.hasLiveData,
            state.error,
            state.syncing,
            state.syncLabel,
            state.highlightKeys,
            state.isRealtimeLive,
            refreshPanel
        ]
    );

    return <DashboardPanelContext.Provider value={value}>{children}</DashboardPanelContext.Provider>;
}
