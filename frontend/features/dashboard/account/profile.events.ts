import { Session } from '../../../types.js';
import { UI } from '../../../core/ui.js';
import { AccountMessages } from './messages.js';
import { DASHBOARD_CONFIG } from '../dashboard-config.js';
import { HtmlLoader } from '../../../shared/utils/htmlLoader.js';

export interface ProfileContext {
    session: Session | null;
    authHeaders: () => HeadersInit;
}

export const ProfileEvents = {
    setupAll(context: ProfileContext): void {
        this.setupTokenVisibility();
        this.setupRegenerate(context);
        this.setupCopyId();
        this.setupDangerToggle();
        this.setupDataExport(context);
        this.setupDangerZone(context);
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

    setupRegenerate(context: ProfileContext): void {
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
                                DASHBOARD_CONFIG.API_ENDPOINTS.REGENERATE_KEY,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...context.authHeaders()
                                    }
                                }
                            );
                            const data = await response.json();

                            if (data.apiKey && context.session) {
                                context.session.apiKey = data.apiKey;
                                const auth = await import('../../../core/auth.js');
                                auth.Auth.saveSession(context.session);

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

    setupDataExport(context: ProfileContext): void {
        const exportBtn = document.getElementById('profile-export-data-btn');
        if (exportBtn && !exportBtn.dataset.listener) {
            exportBtn.addEventListener('click', async () => {
                if (!context.session) return;
                UI.setButtonLoading(exportBtn as HTMLButtonElement, true);
                try {
                    const { DataExport } = await import('./dataExporter.js');
                    await DataExport.export(context.session);
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

    setupDangerZone(context: ProfileContext): void {
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
                                `${DASHBOARD_CONFIG.API_ENDPOINTS.CLEAR_DATA}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...context.authHeaders()
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
                            const response = await fetch(
                                `${DASHBOARD_CONFIG.API_ENDPOINTS.DELETE_ACCOUNT}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...context.authHeaders()
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
    }
};
