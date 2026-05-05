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

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
    icon?: string;
}

export interface Clip {
    id: string;
    title: string;
    url: string;
    thumbnail_url: string;
    view_count: number;
    created_at: string;
}

export interface ClipsState {
    clips: Clip[];
    filteredClips: Clip[];
    favorites: string[];
    currentPage: number;
    itemsPerPage: number;
    searchTerm: string;
    sortValue: string;
    isLoading: boolean;
    error: string | null;
}

export interface CommandConfig {
    id: string;
    bot: string;
    template: string;
    extraValues: Record<string, string>;
}

export interface CommandsState {
    configs: Record<string, CommandConfig>;
    generatedCommands: Record<string, { full: string; url: string; masked: string }>;
    testResults: Record<string, { status: 'success' | 'error' | null; message: string }>;
}

export interface ProfileData {
    followers: number;
    broadcaster_type: string;
    description: string;
    created_at: string;
    rateLimit: number;
}

export interface ProfileStats {
    summaries: Record<string, number>;
    analytics: Record<string, number>;
}

export interface ProfileState {
    data: ProfileData | null;
    stats: ProfileStats;
    isLoading: boolean;
    countdown: number;
    lastSync: number | null;
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

    // Sistema de Toast Notifications
    toasts: Toast[];

    // Estado de Clips
    clips: ClipsState;

    // Estado de Commands
    commands: CommandsState;

    // Estado de Profile
    profile: ProfileState;
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
    pollingCountdown: 60,
    isLeader: false,

    toasts: [],

    clips: {
        clips: [],
        filteredClips: [],
        favorites: [],
        currentPage: 1,
        itemsPerPage: 20,
        searchTerm: '',
        sortValue: 'date-desc',
        isLoading: false,
        error: null
    },

    commands: {
        configs: {},
        generatedCommands: {},
        testResults: {}
    },

    profile: {
        data: null,
        stats: {
            summaries: {},
            analytics: {}
        },
        isLoading: false,
        countdown: 30,
        lastSync: null
    }
};

// Helper functions para el sistema de Toast
export const ToastActions = {
    add(message: string, type: Toast['type'] = 'success', duration = 4000, icon?: string): void {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentToasts = dashboardStore.getState().toasts;
        dashboardStore.setState({
            toasts: [...currentToasts, { id, message, type, duration, icon }]
        });

        // Auto-remove después de la duración
        setTimeout(() => {
            ToastActions.remove(id);
        }, duration);
    },

    remove(id: string): void {
        const toast = document.getElementById(id);
        if (toast) {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                // Leer estado fresco para no sobreescribir toasts agregados durante la animación
                const freshToasts = dashboardStore.getState().toasts;
                dashboardStore.setState({
                    toasts: freshToasts.filter((t) => t.id !== id)
                });
            });
        } else {
            const freshToasts = dashboardStore.getState().toasts;
            dashboardStore.setState({
                toasts: freshToasts.filter((t) => t.id !== id)
            });
        }
    },

    success(message: string, duration?: number): void {
        this.add(message, 'success', duration);
    },

    error(message: string, duration?: number): void {
        this.add(message, 'error', duration);
    },

    info(message: string, duration?: number): void {
        this.add(message, 'info', duration);
    },

    warning(message: string, duration?: number): void {
        this.add(message, 'warning', duration);
    }
};

// Acciones para el módulo de Clips
export const ClipsActions = {
    setClips(clips: Clip[]): void {
        const currentState = dashboardStore.getState().clips;
        const filtered = this.filterAndSort(clips, currentState.searchTerm, currentState.sortValue);
        dashboardStore.setState({
            clips: {
                ...currentState,
                clips,
                filteredClips: filtered,
                currentPage: 1,
                isLoading: false,
                error: null
            }
        });
    },

    setSearchTerm(searchTerm: string): void {
        const currentState = dashboardStore.getState().clips;
        const filtered = this.filterAndSort(currentState.clips, searchTerm, currentState.sortValue);
        dashboardStore.setState({
            clips: {
                ...currentState,
                searchTerm,
                filteredClips: filtered,
                currentPage: 1
            }
        });
    },

    setSortValue(sortValue: string): void {
        const currentState = dashboardStore.getState().clips;
        const filtered = this.filterAndSort(currentState.clips, currentState.searchTerm, sortValue);
        dashboardStore.setState({
            clips: {
                ...currentState,
                sortValue,
                filteredClips: filtered,
                currentPage: 1
            }
        });
    },

    setPage(page: number): void {
        const currentState = dashboardStore.getState().clips;
        dashboardStore.setState({
            clips: {
                ...currentState,
                currentPage: page
            }
        });
    },

    nextPage(): void {
        const currentState = dashboardStore.getState().clips;
        const maxPage = Math.ceil(currentState.filteredClips.length / currentState.itemsPerPage);
        if (currentState.currentPage < maxPage) {
            this.setPage(currentState.currentPage + 1);
        }
    },

    setLoading(isLoading: boolean): void {
        const currentState = dashboardStore.getState().clips;
        dashboardStore.setState({
            clips: {
                ...currentState,
                isLoading
            }
        });
    },

    setError(error: string | null): void {
        const currentState = dashboardStore.getState().clips;
        dashboardStore.setState({
            clips: {
                ...currentState,
                error,
                isLoading: false
            }
        });
    },

    loadFavorites(userId: string): void {
        try {
            const saved = localStorage.getItem(`clips_favs_${userId}`);
            const favorites = saved ? JSON.parse(saved) : [];
            const currentState = dashboardStore.getState().clips;
            dashboardStore.setState({
                clips: {
                    ...currentState,
                    favorites
                }
            });
        } catch (e) {
            console.error('Error loading favorites', e);
        }
    },

    saveFavorites(userId: string, favorites: string[]): void {
        try {
            localStorage.setItem(`clips_favs_${userId}`, JSON.stringify(favorites));
            const currentState = dashboardStore.getState().clips;
            dashboardStore.setState({
                clips: {
                    ...currentState,
                    favorites
                }
            });
        } catch (e) {
            console.error('Error saving favorites', e);
        }
    },

    toggleFavorite(clipId: string, userId: string): void {
        const currentState = dashboardStore.getState().clips;
        const isFavorite = currentState.favorites.includes(clipId);
        const newFavorites = isFavorite
            ? currentState.favorites.filter((id) => id !== clipId)
            : [...currentState.favorites, clipId];

        this.saveFavorites(userId, newFavorites);

        // Mostrar toast
        if (isFavorite) {
            ToastActions.info('Clip eliminado de favoritos');
        } else {
            ToastActions.success('Clip añadido a favoritos');
        }
    },

    filterAndSort(clips: Clip[], searchTerm: string, sortValue: string): Clip[] {
        let filtered = clips;

        // Filtrar por término de búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = clips.filter((clip) => clip.title.toLowerCase().includes(term));
        }

        // Ordenar
        filtered = [...filtered].sort((a, b) => {
            switch (sortValue) {
                case 'date-desc':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'date-asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'views-desc':
                    return b.view_count - a.view_count;
                case 'views-asc':
                    return a.view_count - b.view_count;
                default:
                    return 0;
            }
        });

        return filtered;
    },

    reset(): void {
        const currentState = dashboardStore.getState().clips;
        dashboardStore.setState({
            clips: {
                ...currentState,
                clips: [],
                filteredClips: [],
                currentPage: 1,
                isLoading: false,
                error: null
            }
        });
    }
};

// Acciones para el módulo de Commands
export const CommandsActions = {
    updateConfig(commandId: string, config: Partial<CommandConfig>): void {
        const currentState = dashboardStore.getState().commands;
        const currentConfig = currentState.configs[commandId] || {
            id: commandId,
            bot: 'nightbot',
            template: '',
            extraValues: {}
        };

        dashboardStore.setState({
            commands: {
                ...currentState,
                configs: {
                    ...currentState.configs,
                    [commandId]: { ...currentConfig, ...config }
                }
            }
        });
    },

    setCommandConfig(
        commandId: string,
        bot: string,
        template: string,
        extraValues: Record<string, string>
    ): void {
        this.updateConfig(commandId, { bot, template, extraValues });
    },

    setGeneratedCommand(commandId: string, full: string, url: string, masked: string): void {
        const currentState = dashboardStore.getState().commands;
        dashboardStore.setState({
            commands: {
                ...currentState,
                generatedCommands: {
                    ...currentState.generatedCommands,
                    [commandId]: { full, url, masked }
                }
            }
        });
    },

    setTestResult(testId: string, status: 'success' | 'error' | null, message: string): void {
        const currentState = dashboardStore.getState().commands;
        dashboardStore.setState({
            commands: {
                ...currentState,
                testResults: {
                    ...currentState.testResults,
                    [testId]: { status, message }
                }
            }
        });
    },

    clearTestResult(testId: string): void {
        const currentState = dashboardStore.getState().commands;
        const newResults = { ...currentState.testResults };
        delete newResults[testId];
        dashboardStore.setState({
            commands: {
                ...currentState,
                testResults: newResults
            }
        });
    },

    reset(): void {
        const currentState = dashboardStore.getState();
        dashboardStore.setState({
            ...currentState,
            commands: {
                configs: {},
                generatedCommands: {},
                testResults: {}
            }
        });
    }
};

// Acciones para el módulo de Profile
export const ProfileActions = {
    setProfileData(data: ProfileData): void {
        const currentState = dashboardStore.getState().profile;
        dashboardStore.setState({
            profile: {
                ...currentState,
                data,
                isLoading: false
            }
        });
    },

    setStats(stats: ProfileStats): void {
        const currentState = dashboardStore.getState().profile;
        dashboardStore.setState({
            profile: {
                ...currentState,
                stats
            }
        });
    },

    setLoading(isLoading: boolean): void {
        const currentState = dashboardStore.getState().profile;
        dashboardStore.setState({
            profile: {
                ...currentState,
                isLoading
            }
        });
    },

    setCountdown(countdown: number): void {
        const currentState = dashboardStore.getState().profile;
        dashboardStore.setState({
            profile: {
                ...currentState,
                countdown
            }
        });
    },

    updateLastSync(): void {
        const currentState = dashboardStore.getState().profile;
        const now = Date.now();
        localStorage.setItem('dashboard_last_sync', now.toString());
        dashboardStore.setState({
            profile: {
                ...currentState,
                lastSync: now
            }
        });
    },

    reset(): void {
        const currentState = dashboardStore.getState();
        dashboardStore.setState({
            ...currentState,
            profile: {
                data: null,
                stats: {
                    summaries: {},
                    analytics: {}
                },
                isLoading: false,
                countdown: 30,
                lastSync: null
            }
        });
    }
};

export const dashboardStore = new Store<DashboardState>(initialState);

// Sincronizar estado online/offline automáticamente
window.addEventListener('online', () => dashboardStore.setState({ isOnline: true }));
window.addEventListener('offline', () => dashboardStore.setState({ isOnline: false }));
