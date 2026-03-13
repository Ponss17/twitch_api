import { Session, DashboardModule } from '../../../types.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';

interface IRussianModule extends DashboardModule {
    session: Session | null;
    gameEndpoint: string;
    cssLoaded: boolean;
    pullTrigger(): Promise<void>;
    setLoading(_isLoading: boolean): void;
    showResponse(_text: string, _type: 'success' | 'error'): void;
}

export const RussianModule: IRussianModule = {
    ...BaseModule,
    gameEndpoint: `${DASHBOARD_CONFIG.API_ENDPOINTS.BASE}/minigames/russian`,

    init(session: Session): void {
        this.initBase(session, 'css/sections/russian.css');
    },

    activate(): void {
        const btn = document.getElementById('btn-fire-russian');
        if (btn && !btn.dataset.listener) {
            btn.addEventListener('click', () => this.pullTrigger());
            btn.dataset.listener = 'true';
        }
    },

    deactivate(): void {},

    setLoading(isLoading: boolean): void {
        const btn = document.getElementById('btn-fire-russian') as HTMLButtonElement;
        const responseEl = document.getElementById('russian-response');
        const gunIcon = document.getElementById('russian-gun-icon');

        if (isLoading) {
            if (btn) btn.disabled = true;
            if (gunIcon) {
                gunIcon.classList.add('fa-shake');
                gunIcon.style.color = 'var(--accent)';
            }
            if (responseEl) {
                responseEl.className = 'response-card active';
                responseEl.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Girando el cilindro...</span>
                `;
            }
        } else {
            if (btn) btn.disabled = false;
        }
    },

    showResponse(text: string, type: 'success' | 'error'): void {
        const responseEl = document.getElementById('russian-response');
        const gunIcon = document.getElementById('russian-gun-icon');

        if (responseEl) {
            const icon = type === 'success' ? 'fa-circle-check' : 'fa-skull';
            responseEl.className = `response-card ${type} active`;
            responseEl.innerHTML = `
                <i class="fa-solid ${icon}"></i>
                <span>${text}</span>
            `;

            if (gunIcon) {
                gunIcon.classList.remove('fa-shake');
                if (type === 'error') {
                    gunIcon.style.color = 'var(--danger)';
                    gunIcon.classList.replace('fa-gun', 'fa-skull');
                } else {
                    gunIcon.style.color = 'var(--success)';
                }

                setTimeout(() => {
                    gunIcon.classList.replace('fa-skull', 'fa-gun');
                    gunIcon.style.color = 'var(--text-muted)';
                }, 3000);
            }
        }
    },

    async pullTrigger(): Promise<void> {
        if (!this.session) return;

        this.setLoading(true);

        try {
            const url = `${this.gameEndpoint}?user=${encodeURIComponent(this.session.login)}&channel=${encodeURIComponent(this.session.login)}&hardcore=false&format=json`;

            const response = await fetch(url, {
                headers: this.authHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                this.showResponse(data.message, data.status === 'dead' ? 'error' : 'success');
            } else {
                const { formatApiError } = await import('../../../shared/utils/api-errors.js');
                const errorMsg = await formatApiError(response);
                this.showResponse(`Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('Error in Russian Roulette:', error);
            this.showResponse('La pistola se encasquilló (Error de API)', 'error');
        } finally {
            this.setLoading(false);
        }
    }
};
