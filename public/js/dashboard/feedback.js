import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { UI } from '../ui.js';

export const FeedbackModule = {
    session: null,

    init(session) {
        this.session = session;
        this.setupUI();
    },

    setupUI() {
        const sendFeedbackBtn = document.getElementById('send-feedback-btn');
        if (!sendFeedbackBtn) return;

        const newBtn = sendFeedbackBtn.cloneNode(true);
        sendFeedbackBtn.parentNode.replaceChild(newBtn, sendFeedbackBtn);

        newBtn.addEventListener('click', () => this.sendFeedback());
    },

    async sendFeedback() {
        const sendFeedbackBtn = document.getElementById('send-feedback-btn');
        const messageInput = document.getElementById('feedback-message');
        if (!sendFeedbackBtn || !messageInput) return;

        const message = messageInput.value.trim();

        if (!message) {
            UI.showToast(Messages.Feedback.emptyMessage, 'error');
            return;
        }

        sendFeedbackBtn.disabled = true;
        const originalText = sendFeedbackBtn.innerHTML;
        sendFeedbackBtn.innerHTML = Messages.Feedback.sending;

        try {
            const { apiKey, token } = this.session;
            const headers = { 'Content-Type': 'application/json' };
            let url = API_ENDPOINTS.FEEDBACK;

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else if (apiKey) {
                url += `?apiKey=${apiKey}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                UI.showToast(Messages.Feedback.success, 'success');
                messageInput.value = '';
            } else {
                throw new Error('Error al enviar');
            }
        } catch (e) {
            console.error(e);
            UI.showToast(Messages.Feedback.error, 'error');
        } finally {
            sendFeedbackBtn.disabled = false;
            sendFeedbackBtn.innerHTML = originalText;
        }
    }
};
