import { Session, DashboardModule } from '../../types.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
import { UI } from '../../ui.js';

interface IRussianModule extends DashboardModule {
    gameEndpoint: string;
    pullTrigger(): Promise<void>;
}

export const RussianModule: IRussianModule = {
    session: null,
    gameEndpoint: `${DASHBOARD_CONFIG.API_ENDPOINTS.BASE}/minigames/russian`,

    init(session: Session) {
        this.session = session;
    },

    activate() {
        const btn = document.getElementById('btn-fire-russian');
        if (btn && !btn.dataset.listener) {
            btn.addEventListener('click', () => this.pullTrigger());
            btn.dataset.listener = 'true';
        }
    },

    deactivate() {},

    async pullTrigger() {
        if (!this.session) return;

        const btn = document.getElementById('btn-fire-russian') as HTMLButtonElement;
        const checkbox = document.getElementById('russian-hardcore') as HTMLInputElement;
        const resultBox = document.getElementById('russian-result');
        const messageEl = document.getElementById('russian-message');
        const gunIcon = document.getElementById('russian-gun-icon');

        const isHardcore = checkbox.checked;

        if (btn) btn.disabled = true;
        if (resultBox) resultBox.classList.add('hidden');
        if (gunIcon) {
            gunIcon.classList.add('fa-shake');
            gunIcon.style.color = 'var(--accent-color)';
        }

        try {
            const params = new URLSearchParams({
                user: this.session.login,
                channel: this.session.login,
                hardcore: String(isHardcore),
                format: 'json'
            });

            const response = await fetch(`${this.gameEndpoint}?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${this.session.token}`
                }
            });

            const data = await response.json();

            if (messageEl && resultBox && gunIcon) {
                resultBox.classList.remove('hidden');
                messageEl.textContent = data.message;

                gunIcon.classList.remove('fa-shake');

                if (data.status === 'dead') {
                    resultBox.className = 'result-box error visible';
                    gunIcon.style.color = 'var(--danger-color)';
                    gunIcon.classList.replace('fa-gun', 'fa-skull');
                } else {
                    resultBox.className = 'result-box success visible';
                    gunIcon.style.color = 'var(--success-color)';
                }

                setTimeout(() => {
                    gunIcon.classList.replace('fa-skull', 'fa-gun');
                    gunIcon.style.color = 'var(--text-muted)';
                }, 3000);
            }
        } catch (error) {
            console.error('Error in Russian Roulette:', error);
            UI.showToast('La pistola se encasquilló (Error de API)', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    }
};
