import { Store } from './store.js';

export interface ActivityLog {
    action: string;
    timestamp: string;
}

export interface StatsData {
    todayRequests: number;
    rawSuccessRate: number;
    avgLatencyMs: number;
}

export interface HealthStatus {
    status: string;
}

interface DashboardState {
    user: {
        displayName: string;
        login: string;
        avatarUrl: string;
        userId: string;
    } | null;
    activeTab: string;
    isLoading: boolean;
    isOnline: boolean;
    error: string | null;

    // Nuevos campos del estado global reactivo
    stats: StatsData | null;
    health: HealthStatus | null;
    activityLogs: ActivityLog[];
    pollingCountdown: number;
    isLeader: boolean;
}

const initialState: DashboardState = {
    user: null,
    activeTab: 'tab-home',
    isLoading: true,
    isOnline: navigator.onLine,
    error: null,

    stats: null,
    health: null,
    activityLogs: [],
    pollingCountdown: 30,
    isLeader: false
};

export const dashboardStore = new Store<DashboardState>(initialState);

// Sincronizar estado online/offline automáticamente
window.addEventListener('online', () => dashboardStore.setState({ isOnline: true }));
window.addEventListener('offline', () => dashboardStore.setState({ isOnline: false }));
