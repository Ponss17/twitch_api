import { FeedbackMessages } from './feedback/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { UI } from '../ui.js';
import { Session } from '../types.js';

export const FeedbackModule = {
    session: null as Session | null,
    initialized: false,

    init(session: Session) {
        this.session = session;
        if (this.initialized) return;
        this.setupUI();
        this.initialized = true;
    },

    deactivate() {},

    setupUI() {
        requestAnimationFrame(() => {
            const sendFeedbackBtn = document.getElementById('send-feedback-btn');
            if (sendFeedbackBtn) {
                sendFeedbackBtn.addEventListener('click', () => this.sendFeedback());
            }
        });
    },

    async sendFeedback() {
        const submitBtn = document.getElementById('send-feedback-btn') as HTMLButtonElement;
        const messageInput = document.getElementById('feedback-message') as HTMLInputElement;
        if (!submitBtn || !messageInput) return;

        const message = messageInput.value.trim();

        if (!message) {
            UI.showToast(FeedbackMessages.emptyMessage, 'error');
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

            const body: { message: string; apiKey?: string } = {
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
                UI.showToast(FeedbackMessages.success, 'success');
                messageInput.value = '';
            } else {
                throw new Error(data.error || data.message || 'Failed to submit feedback');
            }
        } catch (e) {
            console.error('Error submitting feedback:', e);
            UI.showToast((e as Error).message || FeedbackMessages.error, 'error');
        } finally {
            UI.setButtonLoading(submitBtn, false);
        }
    }
};
