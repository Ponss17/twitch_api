import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { UI } from '../ui.js';
import { Session } from '../types.js';

export const FeedbackModule = {
    session: null as Session | null,

    init(session: Session) {
        this.session = session;
        this.setupUI();
    },

    setupUI() {
        requestAnimationFrame(() => {
            const sendFeedbackBtn = document.getElementById('send-feedback-btn');
            if (!sendFeedbackBtn) {
                console.error('Feedback button not found');
                return;
            }

            const newBtn = sendFeedbackBtn.cloneNode(true);
            sendFeedbackBtn.parentNode!.replaceChild(newBtn, sendFeedbackBtn);

            newBtn.addEventListener('click', () => this.sendFeedback());
        });
    },

    async sendFeedback() {
        const submitBtn = document.getElementById('send-feedback-btn') as HTMLButtonElement;
        const messageInput = document.getElementById('feedback-message') as HTMLInputElement;
        if (!submitBtn || !messageInput) return;

        const message = messageInput.value.trim();

        if (!message) {
            UI.showToast(Messages.Feedback.emptyMessage, 'error');
            return;
        }

        UI.setButtonLoading(submitBtn, true);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (this.session?.token) {
                headers['Authorization'] = `Bearer ${this.session.token}`;
            }

            const body: any = {
                message: message
            };

            if (!this.session?.token && this.session?.apiKey) {
                body.apiKey = this.session.apiKey;
            }

            const response = await fetch(API_ENDPOINTS.FEEDBACK, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                UI.showToast(Messages.Feedback.success, 'success');
                messageInput.value = '';
            } else {
                throw new Error(data.error || 'Failed to submit feedback');
            }
        } catch (e) {
            console.error('Error submitting feedback:', e);
            UI.showToast((e as Error).message || Messages.Feedback.error, 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    }
};
