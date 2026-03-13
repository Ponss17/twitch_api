import { Magic8Messages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
import { Session, DashboardModule } from '../../../types.js';
import { BaseModule } from '../../../shared/utils/baseModule.js';

interface IMagic8Module extends DashboardModule {
    cssLoaded: boolean;
    initialized: boolean;
    uiInitialized: boolean;
    setupUI(): void;
    askQuestion(): Promise<void>;
    setLoading(_isLoading: boolean): void;
}

export const Magic8Module: IMagic8Module = {
    ...BaseModule,
    session: null,
    initialized: false,
    uiInitialized: false,
    cssLoaded: false,

    init(session: Session): void {
        this.initBase(session, 'css/sections/magic8.css');
    },

    activate() {
        if (!this.uiInitialized) {
            this.setupUI();
            this.uiInitialized = true;
        }
    },

    deactivate() {},

    setupUI() {
        const questionInput = document.getElementById(DOM_IDS.MAGIC8.INPUT) as HTMLInputElement;
        const askBtn = document.getElementById(DOM_IDS.MAGIC8.BUTTON) as HTMLButtonElement;
        if (!questionInput || !askBtn) return;

        const handleAsk = () => this.askQuestion();
        askBtn.onclick = handleAsk;
        questionInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleAsk();
        };
    },

    setLoading(isLoading: boolean) {
        const btn = document.getElementById(DOM_IDS.MAGIC8.BUTTON) as HTMLButtonElement;
        const input = document.getElementById(DOM_IDS.MAGIC8.INPUT) as HTMLInputElement;
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);

        if (btn) {
            btn.disabled = isLoading;
            btn.innerHTML = isLoading ? Magic8Messages.consulting : Magic8Messages.askButton;
        }
        if (input) input.disabled = isLoading;
        if (isLoading && responseEl) {
            responseEl.className = 'response-card active';
            responseEl.innerHTML = Magic8Messages.loading;
        }
    },

    async askQuestion() {
        const input = document.getElementById(DOM_IDS.MAGIC8.INPUT) as HTMLInputElement;
        const question = input?.value.trim();
        if (!question) {
            this.showResponse(Magic8Messages.emptyQuestion, 'error');
            return;
        }

        this.setLoading(true);
        try {
            if (!this.session) throw new Error('No active session');
            const { login } = this.session;
            const mood =
                (document.getElementById('extra-magic8-mood') as HTMLSelectElement)?.value ||
                'classic';
            const url = `${API_ENDPOINTS.MAGIC8}?question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(login || '')}`;

            const res = await fetch(url, { headers: this.authHeaders() });
            if (res.ok) {
                const answer = await res.text();
                this.showResponseIn(DOM_IDS.MAGIC8.RESPONSE, answer, 'success');
            } else {
                const { formatApiError } = await import('../../../shared/utils/api-errors.js');
                const errorMsg = await formatApiError(res);
                this.showResponseIn(DOM_IDS.MAGIC8.RESPONSE, `Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            this.showResponseIn(
                DOM_IDS.MAGIC8.RESPONSE,
                Magic8Messages.error((error as Error).message),
                'error'
            );
        } finally {
            this.setLoading(false);
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    }
};
