import { Messages } from '../../utils/messages.js';
import { API_ENDPOINTS, DOM_IDS } from '../../utils/constants.js';
export const Magic8Module = {
    session: null,
    initialized: false,
    init(session) {
        this.session = session;
        if (this.initialized)
            return;
        import('../../utils/loader.js').then(({ Loader }) => {
            Loader.loadCSS('css/sections/magic8.css');
        });
        this.setupUI();
        this.initialized = true;
    },
    deactivate() {
        console.log('[Magic8Module] Deactivated');
    },
    setupUI() {
        const questionInput = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const askBtn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);
        if (!questionInput || !askBtn)
            return;
        const handleAsk = () => this.askQuestion();
        askBtn.onclick = handleAsk;
        questionInput.onkeypress = (e) => { if (e.key === 'Enter')
            handleAsk(); };
    },
    setLoading(isLoading) {
        const btn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);
        const input = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
        if (isLoading) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = Messages.Magic8.consulting;
            }
            if (input)
                input.disabled = true;
            if (responseEl) {
                responseEl.className = 'response-card active';
                responseEl.innerHTML = Messages.Magic8.loading;
            }
        }
        else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = Messages.Magic8.askButton;
            }
            if (input)
                input.disabled = false;
        }
    },
    async askQuestion() {
        const input = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const question = input?.value.trim();
        if (!question) {
            this.showResponse(Messages.Magic8.emptyQuestion, 'error');
            return;
        }
        this.setLoading(true);
        try {
            if (!this.session)
                throw new Error('No active session');
            const { apiKey, token, login } = this.session;
            const mood = document.getElementById('extra-magic8-mood')?.value || 'classic';
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
            const url = `${API_ENDPOINTS.MAGIC8}?${tokenParam}&question=${encodeURIComponent(question)}&mood=${mood}&user=${encodeURIComponent(login || '')}`;
            const res = await fetch(url);
            const answer = await res.text();
            this.showResponse(res.ok ? answer : `Error: ${answer}`, res.ok ? 'success' : 'error');
        }
        catch (error) {
            this.showResponse(Messages.Magic8.error(error.message), 'error');
        }
        finally {
            this.setLoading(false);
            if (input) {
                input.value = '';
                input.focus();
            }
        }
    },
    showResponse(text, type) {
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
        if (responseEl) {
            responseEl.textContent = text;
            responseEl.className = `response-card ${type} active`;
        }
    }
};
