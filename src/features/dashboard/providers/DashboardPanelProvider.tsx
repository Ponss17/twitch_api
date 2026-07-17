import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Session } from '@/core/config/config';
import type { DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import { useDashboardPanelState } from './hooks/useDashboardPanelState';
import { useDashboardPanelEngine } from './hooks/useDashboardPanelEngine';
import type { DashboardLiveStats } from '@/features/dashboard/lib/dashboardStats';
import type { ActivityLogItem } from '@/features/dashboard/lib/activityLogDisplay';

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
}

const DashboardPanelContext = createContext<DashboardPanelContextValue | null>(null);

export function useDashboardPanel(): DashboardPanelContextValue {
    const ctx = useContext(DashboardPanelContext);
    if (!ctx) {
        throw new Error('useDashboardPanel debe usarse dentro de DashboardPanelProvider');
    }
    return ctx;
}

interface DashboardPanelProviderProps {
    active: boolean;
    session: Session;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    children: ReactNode;
}

export function DashboardPanelProvider({
    active,
    session,
    showToast,
    children
}: DashboardPanelProviderProps) {
    const { state, actions, refs } = useDashboardPanelState(session);

    useDashboardPanelEngine({
        active,
        session,
        showToast,
        state,
        actions,
        refs
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
            isRealtimeLive: state.isRealtimeLive
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
            state.isRealtimeLive
        ]
    );

    return <DashboardPanelContext.Provider value={value}>{children}</DashboardPanelContext.Provider>;
}