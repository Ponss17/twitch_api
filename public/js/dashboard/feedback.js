import { Messages } from '../utils/messages.js';
import { UI } from '../ui.js';
export const FeedbackModule = {
    session: null,
    init(session) {
        this.session = session;
        this.setupUI();
    },
    setupUI() {
        const sendFeedbackBtn = document.getElementById('send-feedback-btn');
        if (!sendFeedbackBtn)
            return;
        const newBtn = sendFeedbackBtn.cloneNode(true);
        sendFeedbackBtn.parentNode.replaceChild(newBtn, sendFeedbackBtn);
        newBtn.addEventListener('click', () => this.sendFeedback());
    },
    async sendFeedback() {
        const submitBtn = document.getElementById('send-feedback-btn');
        const messageInput = document.getElementById('feedback-message');
        if (!submitBtn || !messageInput)
            return;
        const message = messageInput.value.trim();
        if (!message) {
            UI.showToast(Messages.Feedback.emptyMessage, 'error');
            return;
        }
        UI.setButtonLoading(submitBtn, true);
        try {
            const response = await fetch('/api/system/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });
            if (response.ok) {
                UI.showToast(Messages.Feedback.success, 'success');
                messageInput.value = '';
            }
            else {
                throw new Error('Failed to submit feedback');
            }
        }
        catch (e) {
            console.error('Error submitting feedback:', e);
            UI.showToast(Messages.Feedback.error, 'error');
        }
        finally {
            UI.setButtonLoading(submitBtn, false);
        }
    }
};
