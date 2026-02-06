import { DuelMessages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
import { Session, DashboardModule } from '../../../types.js';

interface IDuelModule extends DashboardModule {
    cssLoaded: boolean;
    initialized: boolean;
    setupUI(): void;
    startDuel(): Promise<void>;
    showResponse(text: string, type: string): void;
    setLoading(isLoading: boolean): void;
}

export const DuelModule: IDuelModule = {
    session: null,
    initialized: false,

    cssLoaded: false,

    init(session: Session): void {
        this.session = session;

        if (!this.cssLoaded) {
            import('../../../shared/utils/loader.js').then(({ Loader }) => {
                Loader.loadCSS('css/sections/duel.css');
            });
            this.cssLoaded = true;
        }

        this.setupUI();
        this.initialized = true;
    },

    deactivate() {},

    setupUI() {
        const targetInput = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET) as HTMLInputElement;
        const fightBtn = document.getElementById(DOM_IDS.DUEL.BUTTON) as HTMLButtonElement;

        if (!targetInput || !fightBtn) return;

        const handleFight = () => this.startDuel();
        fightBtn.onclick = handleFight;
        targetInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleFight();
        };
    },

    setLoading(isLoading: boolean) {
        const btn = document.getElementById(DOM_IDS.DUEL.BUTTON) as HTMLButtonElement;
        const inputTarget = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET) as HTMLInputElement;
        const inputChallenger = document.getElementById(
            DOM_IDS.DUEL.INPUT_CHALLENGER
        ) as HTMLInputElement;
        const responseEl = document.getElementById(DOM_IDS.DUEL.RESPONSE);

        if (isLoading) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = DuelMessages.fighting;
            }
            if (inputTarget) inputTarget.disabled = true;
            if (inputChallenger) inputChallenger.disabled = true;
            if (responseEl) {
                responseEl.className = 'response-card active';
                responseEl.innerHTML = DuelMessages.loading;
            }
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = DuelMessages.fightButton;
            }
            if (inputTarget) inputTarget.disabled = false;
            if (inputChallenger) inputChallenger.disabled = false;
        }
    },

    async startDuel() {
        const inputTarget = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET) as HTMLInputElement;
        const inputChallenger = document.getElementById(
            DOM_IDS.DUEL.INPUT_CHALLENGER
        ) as HTMLInputElement;

        const target = inputTarget?.value.trim();
        const challenger = inputChallenger?.value.trim() || 'Streamer';

        if (!target) {
            this.showResponse(DuelMessages.emptyTarget, 'error');
            return;
        }

        this.setLoading(true);
        try {
            if (!this.session) throw new Error('No active session');
            const { apiKey, token } = this.session;

            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${API_ENDPOINTS.DUEL}?${tokenParam}&target=${encodeURIComponent(target)}&challenger=${encodeURIComponent(challenger)}`;

            const res = await fetch(url);
            const answer = await res.text();
            this.showResponse(res.ok ? answer : `Error: ${answer}`, res.ok ? 'success' : 'error');
        } catch (error) {
            this.showResponse(DuelMessages.error((error as Error).message), 'error');
        } finally {
            this.setLoading(false);
        }
    },

    showResponse(text: string, type: string) {
        const responseEl = document.getElementById(DOM_IDS.DUEL.RESPONSE);
        if (responseEl) {
            responseEl.textContent = text;
            responseEl.className = `response-card ${type} active`;
        }
    }
};
