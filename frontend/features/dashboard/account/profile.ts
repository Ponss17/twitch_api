import { Session, DashboardModule } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';
import { Loader } from '../../../shared/utils/loader.js';
import { ProfileAPI } from './profile.api.js';
import { ProfileEvents } from './profile.events.js';
import { ProfileUI } from './profile.ui.js';
import { UI } from '../../../core/ui-core.js';
import { dashboardStore, ProfileActions } from '../../../core/dashboardStore.js';

interface IProfileModule extends DashboardModule {
    session: Session | null;
    isInitialized: boolean;
    pollInterval: ReturnType<typeof setInterval> | null;
    unsubscribers: Array<() => void>;
    setupStoreSubscriptions(): void;
    setupUI(): void;
    startSmartPolling(): void;
    performSync(): Promise<void>;
}

export const ProfileModule: IProfileModule = {
    ...BaseModule,
    session: null,
    isInitialized: false,
    pollInterval: null,
    unsubscribers: [],

    init(session: Session): void {
        this.session = session;
        this.isInitialized = true;
    },

    activate(): void {
        Loader.loadCSS('./css/sections/profile.css');
        this.setupUI();
        this.setupStoreSubscriptions();
        this.startSmartPolling();

        // Cargar datos iniciales si no hay datos en el store
        const profileState = dashboardStore.getState().profile;
        if (!profileState.data && !profileState.isLoading) {
            this.performSync();
        }
    },

    deactivate(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.unsubscribers.forEach((unsub) => unsub());
        this.unsubscribers = [];
    },

    setupStoreSubscriptions(): void {
        // Suscribirse a cambios en el perfil
        this.unsubscribers.push(
            dashboardStore.on('profile', (state) => {
                if (state.profile.data) {
                    ProfileUI.updateProfileStatsInternal(state.profile.data);
                    ProfileUI.updateBadgesInternal(
                        state.profile.data as unknown as Record<string, string>
                    );
                }
                if (state.profile.stats.analytics) {
                    ProfileUI.renderCommandStatsInternal(state.profile.stats.analytics, {
                        summaries: state.profile.stats.summaries
                    });
                }
            })
        );
    },

    setupUI(): void {
        if (!this.session) return;

        const userIdTag = document.getElementById('profile-user-id');
        const displayName = document.getElementById('profile-display-name');
        const avatar = document.getElementById('profile-large-avatar') as HTMLImageElement;

        if (userIdTag) userIdTag.textContent = this.session.userId || '---';
        if (displayName)
            displayName.textContent = this.session.displayName || this.session.login || 'Streamer';
        if (avatar && this.session.profile_image_url) avatar.src = this.session.profile_image_url;

        const tokenInput = document.getElementById('profile-api-key') as HTMLInputElement;
        if (tokenInput) {
            const realKey = this.session.apiKey || this.session.token || '';
            // Guardar la clave real en dataset para uso interno
            tokenInput.dataset.realValue = realKey;
            // Mostrar valor enmascarado por seguridad (evita exposición en DOM)
            tokenInput.value = UI.maskApiKey(realKey);
            // Asegurar que el input siempre comience como password
            tokenInput.type = 'password';
        }

        ProfileEvents.setupAll({
            session: this.session,
            authHeaders: () => this.authHeaders()
        });
    },

    startSmartPolling(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        const pollMs = 30000;

        let countdown = 30;
        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                countdown = 30;
                this.performSync();
            }
        } else {
            countdown = 30;
            this.performSync();
        }

        ProfileActions.setCountdown(countdown);

        this.pollInterval = setInterval(() => {
            const currentState = dashboardStore.getState().profile;
            let currentCountdown = currentState.countdown - 1;
            if (currentCountdown <= 0) {
                this.performSync();
                currentCountdown = 30;
            }
            ProfileActions.setCountdown(currentCountdown);
        }, 1000);
    },

    async performSync(): Promise<void> {
        if (!this.session) return;

        ProfileActions.setLoading(true);

        try {
            const data = await ProfileAPI.fetchSummary(this.session, () => this.authHeaders());

            if (data.profile) {
                ProfileActions.setProfileData({
                    followers: (data.profile.followers as number) || 0,
                    broadcaster_type: (data.profile.broadcaster_type as string) || '',
                    description: (data.profile.description as string) || '',
                    created_at: (data.profile.created_at as string) || '',
                    rateLimit: (data.profile.rateLimit as number) || 120
                });
            }

            if (data.analytics) {
                const summaries: Record<string, number> = {};

                // Calcular totales por categoría
                const categories = [
                    { id: 'cat-commands', keys: ['clips', 'followage', 'so', 'message'] },
                    { id: 'cat-tools', keys: ['stalker', 'trends', 'roulette'] },
                    { id: 'cat-minigames', keys: ['russian', 'magic8', 'duel'] }
                ];

                categories.forEach((cat) => {
                    summaries[cat.id] = cat.keys.reduce(
                        (sum, key) => sum + ((data.analytics![key] as number) || 0),
                        0
                    );
                });

                ProfileActions.setStats({
                    summaries,
                    analytics: data.analytics
                });
            }

            ProfileActions.updateLastSync();
        } catch (error) {
            console.error('[Profile] Error en sync:', error);
        } finally {
            ProfileActions.setLoading(false);
            const syncEl = document.getElementById('profile-sync-indicator');
            if (syncEl) {
                syncEl.classList.add('syncing');
                setTimeout(() => syncEl.classList.remove('syncing'), 1000);
            }
        }
    }
};
