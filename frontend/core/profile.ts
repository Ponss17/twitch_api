import { Session, DashboardModule } from '../types.js';
import { UI } from './ui.js';
import { DASHBOARD_CONFIG } from '../features/dashboard/dashboard-config.js';
import { AccountMessages } from '../features/dashboard/account/messages.js';
import { HtmlLoader } from '../shared/utils/htmlLoader.js';
import { Loader } from '../shared/utils/loader.js';

export const ProfileModule: DashboardModule = {
    session: null as Session | null,
    isInitialized: false,
    rateLimitPollInterval: null as ReturnType<typeof setInterval> | null,
    countdown: 30,
    lastData: {
        followers: -1,
        analytics: {} as Record<string, number>,
        summaries: {} as Record<string, number>
    },

    get authHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        if (this.session?.token) headers['Authorization'] = `Bearer ${this.session.token}`;
        return headers;
    },

    get authQuery(): string {
        if (this.session?.apiKey) return `apiKey=${encodeURIComponent(this.session.apiKey)}`;
        if (this.session?.token) return `token=${encodeURIComponent(this.session.token)}`;
        return '';
    },

    init(session: Session): void {
        this.session = session;
        this.isInitialized = true;
    },

    activate(): void {
        Loader.loadCSS('./css/sections/profile.css');
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

        const lastSync = localStorage.getItem('dashboard_last_sync');
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
        syncEl.textContent = 'Auto';
    },

    async performSync(): Promise<void> {
        const syncEl = document.getElementById('profile-sync-indicator');
        if (this.session) {
            localStorage.setItem('dashboard_last_sync', Date.now().toString());
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
        this.setupDangerToggle();
        this.setupDataExport();
        this.setupDangerZone();
    },

    setupDangerToggle(): void {
        const toggleBtn = document.getElementById('profile-toggle-danger');
        const dangerSection = document.getElementById('danger-zone-section');

        if (toggleBtn && dangerSection && !toggleBtn.dataset.listener) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = dangerSection.classList.contains('is-hidden');
                if (isHidden) {
                    dangerSection.classList.remove('is-hidden');
                    toggleBtn.classList.add('active');
                    toggleBtn.title = 'Ocultar Zona de Peligro';
                    setTimeout(() => {
                        const start = window.pageYOffset;
                        const end = document.documentElement.scrollHeight - window.innerHeight;
                        const distance = end - start;
                        const duration = 1200;
                        let startTime: number | null = null;

                        const easeOutQuint = (t: number, b: number, c: number, d: number) => {
                            return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
                        };

                        const animation = (currentTime: number) => {
                            if (startTime === null) startTime = currentTime;
                            const timeElapsed = currentTime - startTime;
                            const run = easeOutQuint(timeElapsed, start, distance, duration);
                            window.scrollTo(0, run);
                            if (timeElapsed < duration) {
                                requestAnimationFrame(animation);
                            } else {
                                window.scrollTo(0, document.documentElement.scrollHeight);
                            }
                        };
                        requestAnimationFrame(animation);
                    }, 400);
                } else {
                    dangerSection.classList.add('is-hidden');
                    toggleBtn.classList.remove('active');
                    toggleBtn.title = 'Mostrar Zona de Peligro';
                }
            });
            toggleBtn.dataset.listener = 'true';
        }
    },

    async loadProfileData(): Promise<void> {
        if (!this.session) return;
        try {
            const q = this.authQuery ? `&${this.authQuery}` : '';
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}${q}`;
            const response = await fetch(url, {
                headers: this.authHeaders
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
            const q = this.authQuery ? `&${this.authQuery}` : '';
            const url = `${DASHBOARD_CONFIG.API_ENDPOINTS.USER_INFO}?login=${this.session.login}${q}`;
            const response = await fetch(url, {
                headers: this.authHeaders
            });
            if (response.ok) {
                const data = await response.json();
                const rateLimitEl = document.getElementById('profile-stat-ratelimit');
                if (rateLimitEl && data.rateLimit) {
                    rateLimitEl.textContent = `${data.rateLimit} req/min`;
                }
            }
        } catch (_e) {
            /*  */
        }
    },

    async loadAnalytics(): Promise<void> {
        if (!this.session) return;
        try {
            const q = this.authQuery ? `?${this.authQuery}` : '';
            const response = await fetch(`${DASHBOARD_CONFIG.API_ENDPOINTS.ANALYTICS}${q}`, {
                headers: this.authHeaders
            });
            if (response.ok) {
                const data: Record<string, number> = await response.json();
                this.renderCommandStatsInternal(data);
            }
        } catch (_e) {
            console.error('Error updating statistics', _e);
        }
    },

    renderCommandStatsInternal(data: Record<string, number>): void {
        const statsGrid = document.getElementById('profile-stats-summary-grid');
        if (!statsGrid) return;

        statsGrid.innerHTML = '';

        const categories = [
            {
                id: 'cat-commands',
                label: 'Comandos',
                icon: 'fa-terminal',
                keys: ['clips', 'followage', 'so']
            },
            {
                id: 'cat-tools',
                label: 'Herramientas',
                icon: 'fa-screwdriver-wrench',
                keys: ['stalker', 'trends', 'roulette']
            },
            {
                id: 'cat-minigames',
                label: 'Minijuegos',
                icon: 'fa-gamepad',
                keys: ['russian', 'magic8', 'duel']
            }
        ];

        categories.forEach((cat) => {
            const totalSum = cat.keys.reduce((sum, key) => sum + (data[key] || 0), 0);

            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-icon"><i class="fa-solid ${cat.icon}"></i></div>
                <div class="stat-info">
                    <h3 id="profile-sum-${cat.id}">0</h3>
                    <span>${cat.label}</span>
                </div>
            `;
            statsGrid.appendChild(card);

            const valueEl = document.getElementById(`profile-sum-${cat.id}`);
            if (valueEl) {
                const prevSum = this.lastData.summaries?.[cat.id] ?? 0;
                if (prevSum !== totalSum) {
                    UI.animateValue(valueEl, null, totalSum);
                    if (!this.lastData.summaries) this.lastData.summaries = {};
                    this.lastData.summaries[cat.id] = totalSum;
                } else {
                    valueEl.textContent = totalSum.toLocaleString();
                }
            }
        });
    },
    updateProfileStatsInternal(data: import('../types.js').ProfileStatsData): void {
        const followers = document.getElementById('profile-stat-followers');
        const bio = document.getElementById('profile-bio');
        const broadcasterType = document.getElementById('profile-stat-broadcaster');
        const createdAt = document.getElementById('profile-stat-created');

        if (followers) {
            const targetValue = data.followers || 0;
            if (this.lastData.followers !== targetValue) {
                UI.animateValue(followers, 0, targetValue, 1500);
                this.lastData.followers = targetValue;
            } else {
                followers.textContent = targetValue.toLocaleString();
            }
        }

        if (bio) {
            bio.textContent =
                data.description || 'Sin biografía disponible. ¡Este streamer es un misterio!';
        }

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
                    UI.showToast('ID copiado al portapapeles', 'success');
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

    setupDataExport(): void {
        const exportBtn = document.getElementById('profile-export-data-btn');
        if (exportBtn && !exportBtn.dataset.listener) {
            exportBtn.addEventListener('click', async () => {
                if (!this.session) return;
                UI.setButtonLoading(exportBtn as HTMLButtonElement, true);
                try {
                    const { DataExport } =
                        await import('../features/dashboard/account/dataExporter.js');
                    await DataExport.export(this.session);
                } catch (e) {
                    console.error('[Profile] Export error:', e);
                    UI.showToast('Error al exportar datos', 'error');
                } finally {
                    UI.setButtonLoading(exportBtn as HTMLButtonElement, false);
                }
            });
            exportBtn.dataset.listener = 'true';
        }
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
                            const q = this.authQuery ? `?${this.authQuery}` : '';
                            const response = await fetch(
                                `${DASHBOARD_CONFIG.API_ENDPOINTS.CLEAR_DATA}${q}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...this.authHeaders
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
                    title: 'Eliminar Perfil de LosPerris API',
                    desc: '¡ATENCIÓN! Esta acción es irreversible dentro de nuestra plataforma. Se borrarán tus datos y API Key. Esto NO afectará a tu canal ni cuenta de Twitch de ninguna manera.',
                    word: 'ELIMINAR',
                    onConfirm: async () => {
                        try {
                            const q = this.authQuery ? `?${this.authQuery}` : '';
                            const response = await fetch(
                                `${DASHBOARD_CONFIG.API_ENDPOINTS.DELETE_ACCOUNT}${q}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...this.authHeaders
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
