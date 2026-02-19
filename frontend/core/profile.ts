import { Session, DashboardModule } from '../types.js';
import { UI } from './ui.js';
import { DASHBOARD_CONFIG } from '../features/dashboard/dashboard-config.js';
import { AccountMessages } from '../features/dashboard/account/messages.js';
import { HtmlLoader } from '../shared/utils/htmlLoader.js';

export const ProfileModule: DashboardModule = {
    session: null as Session | null,
    isInitialized: false,
    rateLimitPollInterval: null as ReturnType<typeof setInterval> | null,
    countdown: 30,

    get authToken(): string {
        return this.session?.token || '';
    },

    init(session: Session): void {
        this.session = session;
        this.isInitialized = true;
    },

    activate(): void {
        this.setupUIInternal();
        this.loadProfileData();
        this.loadAnalytics();
        this.startSmartPolling();
    },

    deactivate(): void {
        if (this.rateLimitPollInterval) {
            clearInterval(this.rateLimitPollInterval);
            this.rateLimitPollInterval = null;
        }
    },

    startSmartPolling(): void {
        if (this.rateLimitPollInterval) clearInterval(this.rateLimitPollInterval);

        const lastSync = localStorage.getItem('profile_last_sync');
        const now = Date.now();
        const pollMs = 30000;

        if (lastSync) {
            const elapsed = now - parseInt(lastSync);
            if (elapsed < pollMs) {
                this.countdown = Math.ceil((pollMs - elapsed) / 1000);
            } else {
                this.countdown = 30;
                this.performSync();
            }
        } else {
            this.countdown = 30;
            this.performSync();
        }

        this.updateSyncIndicator();

        this.rateLimitPollInterval = setInterval(() => {
            if (typeof this.countdown === 'number') {
                this.countdown--;
                if (this.countdown <= 0) {
                    this.performSync();
                    this.countdown = 30;
                }
            }
            this.updateSyncIndicator();
        }, 1000);
    },

    updateSyncIndicator(): void {
        const syncEl = document.getElementById('profile-sync-indicator');
        if (!syncEl) return;
        syncEl.textContent = `${this.countdown}s`;
    },

    async performSync(): Promise<void> {
        const syncEl = document.getElementById('profile-sync-indicator');
        if (this.session) {
            localStorage.setItem('profile_last_sync', Date.now().toString());
            await Promise.all([this.pollRateLimit(), this.loadAnalytics()]);
        }

        setTimeout(() => {
            if (syncEl) syncEl.classList.remove('syncing');
        }, 1000);
    },

    setupUIInternal(): void {
        if (!this.session) return;

        const userIdTag = document.getElementById('profile-user-id');
        const displayName = document.getElementById('profile-display-name');
        const avatar = document.getElementById('profile-large-avatar') as HTMLImageElement;

        if (userIdTag) userIdTag.textContent = this.session.userId || '---';
        if (displayName)
            displayName.textContent = this.session.displayName || this.session.login || 'Streamer';

        if (avatar && this.session.profile_image_url) {
            avatar.src = this.session.profile_image_url;
        }

        const tokenInput = document.getElementById('profile-api-key') as HTMLInputElement;
        if (tokenInput) {
            const realKey = this.session.apiKey || this.session.token || '';
            tokenInput.value = realKey;
            tokenInput.dataset.realValue = realKey;
        }

        this.setupTokenVisibility();
        this.setupRegenerate();
        this.setupCopyId();
        this.setupDangerZone();
    },

    async loadProfileData(): Promise<void> {
        if (!this.session) return;
        try {
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.updateProfileStatsInternal(data);
                this.updateBadgesInternal(data);
            }
        } catch (e) {
            console.error('[Profile] Error loading data:', e);
        }
    },

    async pollRateLimit(): Promise<void> {
        if (!this.session) return;
        try {
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                const rateLimitEl = document.getElementById('profile-stat-ratelimit');
                if (rateLimitEl && data.rateLimit) {
                    rateLimitEl.textContent = `${data.rateLimit} req/min`;
                }
            }
        } catch (_e) {
            /* polling ignorado */
        }
    },

    async loadAnalytics(): Promise<void> {
        if (!this.session) return;
        try {
            const response = await fetch(DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS, {
                headers: { Authorization: `Bearer ${this.authToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.renderCommandStatsInternal(data);
            }
        } catch (_e) {
            console.error('Error updating statistics', _e);
        }
    },

    renderCommandStatsInternal(data: Record<string, number>): void {
        const container = document.getElementById('profile-commands-grid');
        if (!container) return;

        const statConfig = [
            { key: 'clips', icon: 'fa-film', label: 'Clips' },
            { key: 'followage', icon: 'fa-clock', label: 'Followage' },
            { key: 'so', icon: 'fa-bullhorn', label: 'Shoutouts' }
        ];

        if (container.children.length === 0) {
            let html = '';
            statConfig.forEach((stat, index) => {
                html += `
                    <div class="stat-card stagger-${index + 1}">
                        <div class="stat-icon"><i class="fa-solid ${stat.icon}"></i></div>
                        <div class="stat-info">
                            <h3 class="counter" id="prof-stat-${stat.key}" data-target="0">0</h3>
                            <span>${stat.label}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        statConfig.forEach((stat) => {
            const el = document.getElementById(`prof-stat-${stat.key}`);
            if (el) UI.animateValue(el, null, data[stat.key] || 0);
        });
    },
    updateProfileStatsInternal(data: import('../types.js').ProfileStatsData): void {
        const followers = document.getElementById('profile-stat-followers');
        const bio = document.getElementById('profile-bio');
        const broadcasterType = document.getElementById('profile-stat-broadcaster');
        const createdAt = document.getElementById('profile-stat-created');

        if (followers) {
            const targetValue = data.followers || 0;
            UI.animateValue(followers, 0, targetValue, 1500);
        }

        if (bio)
            bio.textContent =
                data.description || 'Sin biografía disponible. ¡Este streamer es un misterio!';

        if (broadcasterType) {
            const types: Record<string, string> = {
                partner: 'Partner',
                affiliate: 'Afiliado',
                '': 'Streamer'
            };
            const type = data.broadcaster_type || '';
            broadcasterType.textContent = types[type] || 'Streamer';
        }

        if (createdAt && data.created_at) {
            try {
                const date = new Date(data.created_at);
                const options: Intl.DateTimeFormatOptions = {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                };
                createdAt.textContent = date.toLocaleDateString('es-ES', options);
            } catch (_e) {
                createdAt.textContent = '---';
            }
        }

        const rateLimitEl = document.getElementById('profile-stat-ratelimit');
        if (rateLimitEl && data.rateLimit) {
            rateLimitEl.textContent = `${data.rateLimit} req/min`;
        }
    },

    updateBadgesInternal(data: Record<string, string>): void {
        const container = document.getElementById('profile-badges-container');
        if (!container) return;

        let badgesHtml = '';

        if (data.broadcaster_type === 'partner') {
            badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-check-circle"></i> Partner de Twitch</span>`;
        } else if (data.broadcaster_type === 'affiliate') {
            badgesHtml += `<span class="profile-badge-status"><i class="fa-solid fa-star"></i> Afiliado de Twitch</span>`;
        } else {
            badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-user"></i> Streamer</span>`;
        }

        badgesHtml += `<span class="profile-badge-status secondary"><i class="fa-solid fa-key"></i> LosPerris Access</span>`;

        container.innerHTML = badgesHtml;
    },

    setupTokenVisibility(): void {
        const toggleBtn = document.getElementById('profile-toggle-key');
        const tokenInput = document.getElementById('profile-api-key') as HTMLInputElement;

        if (toggleBtn && tokenInput && !toggleBtn.dataset.listener) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = tokenInput.type === 'password';
                if (isHidden) {
                    tokenInput.type = 'text';
                    tokenInput.value = tokenInput.dataset.realValue || '';
                    toggleBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
                } else {
                    tokenInput.type = 'password';
                    toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
                }
            });
            toggleBtn.dataset.listener = 'true';
        }
    },

    setupCopyId(): void {
        const copyBtn = document.getElementById('profile-copy-id-btn');
        if (copyBtn && !copyBtn.dataset.listener) {
            copyBtn.addEventListener('click', () => {
                const idEl = document.getElementById('profile-user-id');
                const id = idEl?.textContent?.trim();
                if (!id || id === '---') return;
                navigator.clipboard.writeText(id).then(() => {
                    const icon = copyBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fa-solid fa-check';
                        icon.style.opacity = '1';
                        icon.style.color = 'var(--success)';
                        setTimeout(() => {
                            icon.className = 'fa-regular fa-copy';
                            icon.style.opacity = '0.5';
                            icon.style.color = '';
                        }, 1500);
                    }
                });
            });
            copyBtn.dataset.listener = 'true';
        }
    },

    setupRegenerate(): void {
        const regenBtn = document.getElementById('profile-regen-key');
        const modal = document.getElementById('regen-modal') as HTMLDialogElement;

        if (regenBtn && !regenBtn.dataset.listener) {
            regenBtn.addEventListener('click', async () => {
                if (!modal) return;

                if (!document.getElementById('confirm-regen-btn') && modal.dataset.src) {
                    try {
                        await HtmlLoader.load(modal.dataset.src, modal.id);
                    } catch (_e) {
                        UI.showToast('Error al cargar modal de regeneración', 'error');
                        return;
                    }
                }

                const confirmBtn = document.getElementById('confirm-regen-btn');
                if (confirmBtn && !confirmBtn.dataset.listener) {
                    confirmBtn.addEventListener('click', async () => {
                        const closeBtn = document.getElementById('close-regen-btn');
                        if (closeBtn) closeBtn.click();
                        else modal.close();

                        UI.setButtonLoading(regenBtn as HTMLButtonElement, true);
                        try {
                            const response = await fetch(
                                `${DASHBOARD_CONFIG.API_ENDPOINTS.REGENERATE_KEY}?userId=${this.session?.userId}`
                            );
                            const data = await response.json();

                            if (data.apiKey && this.session) {
                                this.session.apiKey = data.apiKey;
                                const auth = await import('./auth.js');
                                auth.Auth.saveSession(this.session);

                                const tokenInput = document.getElementById(
                                    'profile-api-key'
                                ) as HTMLInputElement;
                                if (tokenInput) {
                                    tokenInput.dataset.realValue = data.apiKey;
                                    if (tokenInput.type === 'text') tokenInput.value = data.apiKey;
                                }
                                UI.showToast(AccountMessages.regenerateSuccess, 'success');
                            }
                        } catch (_e) {
                            UI.showToast(AccountMessages.regenerateError, 'error');
                        } finally {
                            UI.setButtonLoading(regenBtn as HTMLButtonElement, false);
                        }
                    });
                    confirmBtn.dataset.listener = 'true';
                }

                const closeBtn = document.getElementById('close-regen-btn');
                const cancelBtn = document.getElementById('cancel-regen-btn');
                if (closeBtn) closeBtn.onclick = () => modal.close();
                if (cancelBtn) cancelBtn.onclick = () => modal.close();

                modal.showModal();
            });
            regenBtn.dataset.listener = 'true';
        }
    },

    async openDangerModal(options: {
        title: string;
        desc: string;
        word: string;
        onConfirm: () => Promise<void>;
    }) {
        const modal = document.getElementById('danger-action-modal') as HTMLDialogElement;
        if (!modal) {
            UI.showToast('Error: Modal de seguridad no encontrado', 'error');
            return;
        }

        if (!document.getElementById('danger-modal-title') && modal.dataset.src) {
            try {
                await HtmlLoader.load(modal.dataset.src, modal.id);
            } catch (_e) {
                UI.showToast('Error al cargar componente de seguridad', 'error');
                return;
            }
        }

        const titleEl = document.getElementById('danger-modal-title');
        const descEl = document.getElementById('danger-modal-desc');
        const wordEl = document.getElementById('danger-modal-word');
        const inputEl = document.getElementById('danger-modal-confirm') as HTMLInputElement;
        const submitBtn = document.getElementById('danger-modal-submit') as HTMLButtonElement;
        const closeBtn = document.getElementById('danger-modal-close');
        const cancelBtn = document.getElementById('danger-modal-cancel');

        if (!titleEl || !descEl || !wordEl || !inputEl || !submitBtn) {
            UI.showToast('Error: Componentes del modal incompletos', 'error');
            console.error('[Profile] Missing modal elements:', {
                titleEl,
                descEl,
                wordEl,
                inputEl,
                submitBtn
            });
            return;
        }

        titleEl.innerText = options.title;
        descEl.innerText = options.desc;
        wordEl.innerText = options.word;
        inputEl.value = '';
        submitBtn.disabled = true;
        modal.classList.remove('shake');

        const validate = () => {
            submitBtn.disabled = inputEl.value.trim().toUpperCase() !== options.word;
        };

        inputEl.oninput = validate;

        return new Promise<void>((resolve) => {
            const cleanup = () => {
                inputEl.oninput = null;
                if (closeBtn) closeBtn.onclick = null;
                if (cancelBtn) cancelBtn.onclick = null;
                submitBtn.onclick = null;
                if (modal.open) modal.close();
                resolve();
            };

            submitBtn.onclick = async () => {
                if (inputEl.value.trim().toUpperCase() === options.word) {
                    UI.setButtonLoading(submitBtn, true);
                    try {
                        await options.onConfirm();
                        cleanup();
                    } catch (_e) {
                        UI.showToast('Error en la acción confirmada', 'error');
                    } finally {
                        UI.setButtonLoading(submitBtn, false);
                    }
                } else {
                    modal.classList.add('shake');
                    setTimeout(() => modal.classList.remove('shake'), 500);
                }
            };

            if (closeBtn) closeBtn.onclick = cleanup;
            if (cancelBtn) cancelBtn.onclick = cleanup;

            modal.showModal();
        });
    },

    setupDangerZone(): void {
        const clearBtn = document.getElementById('profile-clear-data-btn');
        const deleteBtn = document.getElementById('profile-delete-account-btn');

        if (clearBtn && !clearBtn.dataset.listener) {
            clearBtn.addEventListener('click', () => {
                this.openDangerModal({
                    title: 'Reiniciar Estadísticas',
                    desc: 'Esta acción borrará todo el historial de comandos, clips y latencia. Tu cuenta y API Key seguirán activas.',
                    word: 'LIMPIAR',
                    onConfirm: async () => {
                        try {
                            const response = await fetch(
                                DASHBOARD_CONFIG.API_ENDPOINTS.CLEAR_DATA,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${this.authToken}`
                                    },
                                    body: JSON.stringify({ confirm: 'LIMPIAR' })
                                }
                            );

                            const data = await response.json();
                            if (data.success) {
                                UI.showToast(data.message, 'success');
                                setTimeout(() => window.location.reload(), 1500);
                            } else {
                                UI.showToast(data.error || 'Error al limpiar datos', 'error');
                            }
                        } catch (_e) {
                            UI.showToast('Error de conexión', 'error');
                        }
                    }
                });
            });
            clearBtn.dataset.listener = 'true';
        }

        if (deleteBtn && !deleteBtn.dataset.listener) {
            deleteBtn.addEventListener('click', () => {
                this.openDangerModal({
                    title: 'Eliminar Cuenta Permanentemente',
                    desc: '¡ATENCIÓN! Esta acción es irreversible. Se borrarán todos tus datos, API Key y acceso al sistema.',
                    word: 'ELIMINAR',
                    onConfirm: async () => {
                        try {
                            const response = await fetch(
                                DASHBOARD_CONFIG.API_ENDPOINTS.DELETE_ACCOUNT,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${this.authToken}`
                                    },
                                    body: JSON.stringify({ confirm: 'ELIMINAR' })
                                }
                            );

                            const data = await response.json();
                            if (data.success) {
                                UI.showToast('Cuenta eliminada. Redirigiendo...', 'success');
                                setTimeout(() => {
                                    window.location.href = '/logout';
                                }, 2000);
                            } else {
                                UI.showToast(data.error || 'Error al eliminar cuenta', 'error');
                            }
                        } catch (_e) {
                            UI.showToast('Error de conexión', 'error');
                        }
                    }
                });
            });
            deleteBtn.dataset.listener = 'true';
        }
    }
};
