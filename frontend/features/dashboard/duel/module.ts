import { DuelMessages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
import { Session, DashboardModule } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';

interface IDuelModule extends DashboardModule {
    cssLoaded: boolean;
    initialized: boolean;
    uiInitialized: boolean;
    setupUI(): void;
    startDuel(): Promise<void>;
    setLoading(isLoading: boolean): void;
}

export const DuelModule: IDuelModule = {
    ...BaseModule,
    session: null,
    initialized: false,
    uiInitialized: false,
    cssLoaded: false,

    init(session: Session): void {
        this.initBase(session, 'css/sections/duel.css');
    },

    activate() {
        if (!this.uiInitialized) {
            this.setupUI();
            this.uiInitialized = true;
        }
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

        if (btn) {
            btn.disabled = isLoading;
            btn.innerHTML = isLoading ? DuelMessages.fighting : DuelMessages.fightButton;
        }
        if (inputTarget) inputTarget.disabled = isLoading;
        if (inputChallenger) inputChallenger.disabled = isLoading;
        if (isLoading && responseEl) {
            responseEl.className = 'response-card active';
            responseEl.innerHTML = DuelMessages.loading;
        }
    },

    async startDuel() {
        const inputTarget = document.getElementById(DOM_IDS.DUEL.INPUT_TARGET) as HTMLInputElement;
        const inputChallenger = document.getElementById(
            DOM_IDS.DUEL.INPUT_CHALLENGER
        ) as HTMLInputElement;

        const target = inputTarget?.value.trim();
        const challenger = inputChallenger?.value.trim();

        if (!target) {
            this.showResponseIn(DOM_IDS.DUEL.RESPONSE, DuelMessages.emptyTarget, 'error');
            return;
        }

        this.setLoading(true);
        try {
            if (!this.session) throw new Error('No active session');
            const url = `${API_ENDPOINTS.DUEL}?target=${encodeURIComponent(target)}&challenger=${encodeURIComponent(challenger)}`;

            const res = await fetch(url, { headers: this.authHeaders() });
            if (res.ok) {
                const answer = await res.text();
                this.showResponseIn(DOM_IDS.DUEL.RESPONSE, answer, 'success');
            } else {
                const errorMsg = await this.formatApiError(res);
                this.showResponseIn(DOM_IDS.DUEL.RESPONSE, `Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            this.showResponseIn(
                DOM_IDS.DUEL.RESPONSE,
                DuelMessages.error((error as Error).message),
                'error'
            );
        } finally {
            this.setLoading(false);
        }
    }
};
