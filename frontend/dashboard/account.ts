import { Messages } from '../utils/messages.js';
import { API_ENDPOINTS } from '../utils/constants.js';
import { UI } from '../ui.js';
import { Session } from '../types.js';

export const AccountModule = {
    session: null as Session | null,
    isInitialized: false,

    init(session: Session) {
        this.session = session;
        if (this.isInitialized) {
            this.updateValues();
            return;
        }
        this.setupUI();
        this.isInitialized = true;
    },

    updateValues() {
        const userIdInput = document.getElementById('user-id') as HTMLInputElement;
        const userTokenInput = document.getElementById('user-token') as HTMLInputElement;

        if (this.session) {
            if (userIdInput) userIdInput.value = this.session.userId || '';
            if (userTokenInput) {
                userTokenInput.value = this.session.apiKey || this.session.token || '';
                userTokenInput.dataset.realValue = this.session.apiKey || this.session.token || '';
            }
        }
    },

    setupUI() {
        this.updateValues();

        this.setupTokenVisibility();
        this.setupRegenerate();
    },

    setupTokenVisibility() {
        const toggleBtn = document.getElementById('toggle-token-btn');
        const tokenInput = document.getElementById('user-token') as HTMLInputElement;

        if (toggleBtn && tokenInput) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = tokenInput.type === 'password';
                if (isHidden) {
                    tokenInput.type = 'text';
                    tokenInput.value = tokenInput.dataset.realValue || '';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
                } else {
                    tokenInput.type = 'password';
                    toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                }
            });
        }
    },

    setupRegenerate() {
        const regenBtn = document.getElementById('regenerate-token-btn');
        if (regenBtn) {
            regenBtn.addEventListener('click', async () => {
                if (!confirm(Messages.Settings.regenerateConfirm)) return;

                UI.setButtonLoading(regenBtn as HTMLButtonElement, true);
                try {
                    const response = await fetch(`${API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`);
                    const data = await response.json();

                    if (data.apiKey) {
                        if (this.session) {
                            this.session.apiKey = data.apiKey;
                            import('../auth.js').then(({ Auth }) => {
                                Auth.saveSession(this.session!);
                            });
                        }

                        const tokenInput = document.getElementById('user-token') as HTMLInputElement;
                        if (tokenInput) {
                            tokenInput.dataset.realValue = data.apiKey;
                            if (tokenInput.type === 'text') {
                                tokenInput.value = data.apiKey;
                            }
                        }
                        UI.showToast(Messages.Settings.regenerateSuccess, 'success');
                    }
                } catch (e) {
                    UI.showToast(Messages.Settings.regenerateError, 'error');
                } finally {
                    UI.setButtonLoading(regenBtn as HTMLButtonElement, false);
                }
            });
        }
    }
};
