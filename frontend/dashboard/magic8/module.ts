import { Magic8Messages } from './messages.js';
import { CONFIG } from '../../config.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
const { API_ENDPOINTS, DOM_IDS } = DASHBOARD_CONFIG;
import { Session } from '../../types.js';

export const Magic8Module = {
    session: null as Session | null,
    initialized: false,

    cssLoaded: false,

    init(session: Session) {
        this.session = session;

        if (!this.cssLoaded) {
            import('../../utils/loader.js').then(({ Loader }) => {
                Loader.loadCSS('css/sections/magic8.css');
            });
            (this as any).cssLoaded = true;
        }

        this.setupUI();
        this.initialized = true;
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

        if (isLoading) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = Magic8Messages.consulting;
            }
            if (input) input.disabled = true;
            if (responseEl) {
                responseEl.className = 'response-card active';
                responseEl.innerHTML = Magic8Messages.loading;
            }
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = Magic8Messages.askButton;
            }
            if (input) input.disabled = false;
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
            const { apiKey, token, login } = this.session;
            const mood =
                (document.getElementById('extra-magic8-mood') as HTMLSelectElement)?.value ||
                'classic';
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${API_ENDPOINTS.MAGIC8}?${tokenParam}&question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(login || '')}`;

            const res = await fetch(url);
            const answer = await res.text();
            this.showResponse(res.ok ? answer : `Error: ${answer}`, res.ok ? 'success' : 'error');
        } catch (error) {
            this.showResponse(Magic8Messages.error((error as Error).message), 'error');
        } finally {
            this.setLoading(false);
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    },

    showResponse(text: string, type: string) {
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
        if (responseEl) {
            responseEl.textContent = text;
            responseEl.className = `response-card ${type} active`;
        }
    }
};
