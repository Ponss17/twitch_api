import { Messages } from '../utils/messages.js';
import { UI } from '../ui.js';
export const AccountModule = {
    session: null,
    init(session) {
        this.session = session;
        this.setupUI();
    },
    setupUI() {
        const userIdInput = document.getElementById('user-id');
        const userTokenInput = document.getElementById('user-token');
        if (userIdInput)
            userIdInput.value = this.session.userId || '';
        if (userTokenInput) {
            userTokenInput.value = this.session.apiKey || this.session.token || '';
            userTokenInput.dataset.realValue = this.session.apiKey || this.session.token || '';
        }
        this.setupTokenVisibility();
        this.setupRegenerate();
    },
    setupTokenVisibility() {
        const toggleBtn = document.getElementById('toggle-token');
        if (!toggleBtn)
            return;
        const newBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
        newBtn.addEventListener('click', () => {
            const input = document.getElementById('user-token');
            const icon = newBtn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            }
            else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    },
    setupRegenerate() {
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (!regenerateBtn)
            return;
        const newBtn = regenerateBtn.cloneNode(true);
        regenerateBtn.parentNode.replaceChild(newBtn, regenerateBtn);
        newBtn.addEventListener('click', async () => {
            if (!confirm('¿Regenerar API Key? La anterior dejará de funcionar.'))
                return;
            const originalIcon = newBtn.innerHTML;
            UI.setButtonLoading(newBtn, true);
            try {
                const { apiKey, token } = this.session;
                const res = await fetch(`/api/auth/regenerate?userId=${this.session.userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ key: apiKey })
                });
                if (res.ok) {
                    const data = await res.json();
                    const newSession = { ...this.session, apiKey: data.apiKey };
                    localStorage.setItem('twitch_api_session', JSON.stringify(newSession));
                    this.session = newSession;
                    const userTokenInput = document.getElementById('user-token');
                    if (userTokenInput) {
                        userTokenInput.value = data.apiKey;
                        userTokenInput.dataset.realValue = data.apiKey;
                    }
                    UI.showToast(Messages.Settings.regenerateSuccess, 'success');
                }
                else {
                    throw new Error('Error al enviar');
                }
            }
            catch (e) {
                console.error('Regenerate error:', e);
                UI.showToast(Messages.Settings.regenerateError, 'error');
            }
            finally {
                UI.setButtonLoading(newBtn, false);
            }
        });
    }
};
