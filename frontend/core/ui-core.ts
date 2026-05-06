import { UIMessages } from '../shared/messages/uiMessages.js';
import { ToastActions } from './dashboardStore.js';

export const UI = {
    clipboardInitialized: false,

    escapeHTML(str: string) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Enmascara una API Key mostrando solo los últimos 4 caracteres
     * Ejemplo: "abc123xyz789" -> "*********789"
     */
    maskApiKey(apiKey: string): string {
        if (!apiKey || apiKey.length < 8) return '********';
        const lastFour = apiKey.slice(-4);
        const maskedLength = Math.max(8, apiKey.length - 4);
        return '*'.repeat(maskedLength) + lastFour;
    },

    /**
     * Muestra un toast notification usando el sistema conectado al dashboardStore.
     * @param message - Mensaje a mostrar (texto plano, se escapará automáticamente)
     * @param type - Tipo de toast: 'success' | 'error' | 'info' | 'warning'
     * @param duration - Duración en ms (default: 4000)
     */
    showToast(
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'success',
        duration = 4000
    ) {
        // Limpiar el mensaje de cualquier HTML para seguridad
        const cleanMessage = this.escapeHTML(message);
        ToastActions.add(cleanMessage, type, duration);
    },

    copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                this.showToast(UIMessages.Clipboard.copied, 'success');
            })
            .catch(() => {
                this.showToast(UIMessages.Clipboard.error, 'error');
            });
    },

    setupClipboard() {
        if (this.clipboardInitialized) return;
        this.clipboardInitialized = true;

        document.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest('.copy-btn') as HTMLElement;
            if (!btn) return;

            const targetId = btn.dataset.target;
            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    const valueToCopy =
                        target.dataset.realValue ||
                        (target as HTMLInputElement).value ||
                        target.innerText;
                    this.copyToClipboard(valueToCopy);
                }
            }
        });
    },

    setButtonLoading(button: HTMLButtonElement | null, isLoading: boolean) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent || '';
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    },

    disableButton(button: HTMLButtonElement | null) {
        if (!button) return;
        button.disabled = true;
        button.classList.add('btn-disabled');
    },

    enableButton(button: HTMLButtonElement | null) {
        if (!button) return;
        button.disabled = false;
        button.classList.remove('btn-disabled');
    },

    setCardLoading(card: HTMLElement | null, isLoading: boolean) {
        if (!card) return;

        if (isLoading) {
            card.classList.add('card-loading');
        } else {
            card.classList.remove('card-loading');
        }
    },

    _animations: new WeakMap<HTMLElement, number>(),

    animateValue(
        obj: HTMLElement,
        start: number | null,
        end: number,
        duration: number = 1500,
        suffix: string = ''
    ) {
        const prevRaf = this._animations.get(obj);
        if (prevRaf !== undefined) {
            window.cancelAnimationFrame(prevRaf);
            this._animations.delete(obj);
        }

        const textWithoutHtml = obj.innerHTML.replace(/<[^>]*>?/gm, '');
        const currentVal = parseInt(textWithoutHtml.replace(/[^0-9.-]+/g, '')) || 0;
        const actualStart = start !== null ? start : currentVal;

        if (actualStart === end) {
            obj.innerHTML = `${end.toLocaleString()}${suffix}`;
            return;
        }

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(easeProgress * (end - actualStart) + actualStart);
            obj.innerHTML = `${current.toLocaleString()}${suffix}`;

            if (progress < 1) {
                this._animations.set(obj, window.requestAnimationFrame(step));
            } else {
                this._animations.delete(obj);
                obj.innerHTML = `${end.toLocaleString()}${suffix}`;
            }
        };
        this._animations.set(obj, window.requestAnimationFrame(step));
    },

    setupMobileMenu() {
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const navItems = document.querySelectorAll('.nav-item');

        if (!toggleBtn || !sidebar || !overlay) return;

        const toggle = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        };

        const close = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };

        toggleBtn.addEventListener('click', toggle);
        overlay.addEventListener('click', close);

        navItems.forEach((item) => {
            item.addEventListener('click', close);
        });
    }
};
