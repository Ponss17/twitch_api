import { Store } from './store.js';

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
}

const initialState: DashboardState = {
    user: null,
    activeTab: 'tab-home',
    isLoading: true,
    isOnline: navigator.onLine,
    error: null
};

export const dashboardStore = new Store<DashboardState>(initialState);

// Sincronizar estado online/offline automáticamente
window.addEventListener('online', () => dashboardStore.setState({ isOnline: true }));
window.addEventListener('offline', () => dashboardStore.setState({ isOnline: false }));
