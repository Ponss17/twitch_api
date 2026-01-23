import { CONFIG } from '../config.js';
import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS, DOM_IDS } from '../utils/constants.js';

export const Magic8Module = {
    session: null,

    init(sessionParams) {
        this.session = sessionParams;
        this.setupUI();
        this.setupCommandGenerator();
    },

    setupUI() {
        const questionInput = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const askBtn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);

        if (!questionInput || !askBtn) return;

        askBtn.addEventListener('click', () => this.askQuestion());

        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.askQuestion();
            }
        });
    },

    setLoading(isLoading) {
        const btn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);
        const input = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);

        if (isLoading) {
            btn.disabled = true;
            input.disabled = true;
            btn.innerHTML = Messages.Magic8.consulting;

            responseEl.className = 'magic8-response active';
            responseEl.innerHTML = Messages.Magic8.loading;
        } else {
            btn.disabled = false;
            input.disabled = false;
            btn.innerHTML = Messages.Magic8.askButton;
        }
    },

    async askQuestion() {
        const questionInput = document.getElementById(DOM_IDS.MAGIC8.INPUT);
        const askBtn = document.getElementById(DOM_IDS.MAGIC8.BUTTON);

        const question = questionInput.value.trim();

        if (!question) {
            this.showResponse(Messages.Magic8.emptyQuestion, 'error');
            return;
        }

        this.setLoading(true);

        try {
            const { apiKey, token } = this.session;
            const mood = document.getElementById(DOM_IDS.MAGIC8.MOOD_SELECT)?.value || 'classic';
            const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

            const res = await fetch(`${API_ENDPOINTS.MAGIC8}?${tokenParam}&question=${encodeURIComponent(question)}&mood=${mood}`);
            if (!res.ok) {
                const errMsg = await res.text();
                throw new Error(errMsg || 'Error desconocido');
            }

            const answer = await res.text();
            this.showResponse(answer, 'success');

        } catch (error) {
            console.error('Error al consultar Bola 8:', error);
            this.showResponse(Messages.Magic8.error(error.message), 'error');
        } finally {
            questionInput.disabled = false;
            askBtn.disabled = false;
            askBtn.innerHTML = Messages.Magic8.askButton;
            questionInput.value = '';
            questionInput.focus();
        }
    },

    showResponse(html, type) {
        const responseEl = document.getElementById(DOM_IDS.MAGIC8.RESPONSE);
        if (!responseEl) return;

        responseEl.innerHTML = html;
        responseEl.className = `response-card ${type} active`;
    },

    setupCommandGenerator() {
        const commandOutput = document.getElementById(DOM_IDS.MAGIC8.COMMAND_OUTPUT);
        const botSelect = document.getElementById(DOM_IDS.MAGIC8.BOT_SELECT);
        const moodSelect = document.getElementById('magic8-mood-select');

        if (!commandOutput || !botSelect) return;

        const updateCommand = () => {
            const { apiKey } = this.session;
            const bot = botSelect.value;
            const mood = moodSelect ? moodSelect.value : 'classic';

            import('../utils/commandGenerator.js').then(({ CommandGenerator }) => {
                const domain = `${CONFIG.siteUrl}${API_ENDPOINTS.MAGIC8}`;

                let questionVar = '$(querystring)';
                if (bot === 'streamelements' || bot === 'fossabot') {
                    questionVar = '${query}';
                }

                const params = `apiKey=${apiKey}&question=${questionVar}&mood=${mood}`;
                const fetchPart = CommandGenerator.generate(bot, domain, params);
                const rawCmd = `!addcom !8ball ${fetchPart}`;

                const maskedCmd = rawCmd.replace(apiKey, '**************');
                commandOutput.value = maskedCmd;
                commandOutput.dataset.realValue = rawCmd;
            });
        };

        botSelect.addEventListener('change', updateCommand);
        if (moodSelect) moodSelect.addEventListener('change', updateCommand);
        updateCommand();
    }
};
