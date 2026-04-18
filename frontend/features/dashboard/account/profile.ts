import { Session, DashboardModule } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';
import { Loader } from '../../../shared/utils/loader.js';
import { ProfileAPI } from './profile.api.js';
import { ProfileEvents } from './profile.events.js';

export const ProfileModule: DashboardModule = {
    ...BaseModule,
    session: null as Session | null,
    isInitialized: false,
    rateLimitPollInterval: null as ReturnType<typeof setInterval> | null,
    countdown: 30,
    lastData: {
        followers: -1,
        analytics: {} as Record<string, number>,
        summaries: {} as Record<string, number>
    },

    init(session: Session): void {
        this.session = session;
        this.isInitialized = true;
    },

    activate(): void {
        Loader.loadCSS('./css/sections/profile.css');
        this.setupUI();
        this.syncSummary();
        this.startSmartPolling();
    },

    deactivate(): void {
        if (this.rateLimitPollInterval) {
            clearInterval(this.rateLimitPollInterval);
            this.rateLimitPollInterval = null;
        }
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
            tokenInput.value = realKey;
            tokenInput.dataset.realValue = realKey;
        }

        ProfileEvents.setupAll({
            session: this.session,
            authHeaders: () => this.authHeaders()
        });
    },

    async syncSummary(): Promise<void> {
        await ProfileAPI.syncSummary(this.session || null, () => this.authHeaders(), this.lastData);
    },

    startSmartPolling(): void {
        if (this.rateLimitPollInterval) clearInterval(this.rateLimitPollInterval);

        const lastSync = localStorage.getItem('dashboard_last_sync');
        const now = Date.now();
        const pollMs = 30000;

        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                this.countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                this.countdown = 30;
                this.performSync();
            }
        } else {
            this.countdown = 30;
            this.performSync();
        }

        this.updateSyncIndicator();

        this.rateLimitPollInterval = setInterval(() => {
            if (typeof this.countdown === 'number') {
                this.countdown--;
                if (this.countdown <= 0) {
                    this.performSync();
                    this.countdown = 30;
                }
            }
            this.updateSyncIndicator();
        }, 1000);
    },

    updateSyncIndicator(): void {
        const syncEl = document.getElementById('profile-sync-indicator');
        if (!syncEl) return;
        syncEl.textContent = 'Auto';
    },

    async performSync(): Promise<void> {
        const syncEl = document.getElementById('profile-sync-indicator');
        if (this.session) {
            localStorage.setItem('dashboard_last_sync', Date.now().toString());
            await this.syncSummary();
        }
        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    }
};
