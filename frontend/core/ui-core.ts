import { UIMessages } from '../shared/i18n/uiMessages.js';

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

    showToast(message: string, type = 'success', customIcon?: string) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');

        const icon =
            customIcon || (type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation');

        toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> <span></span>`;
        const textSpan = toast.querySelector('span')!;
        textSpan.innerHTML = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                if (toast.parentElement) {
                    toast.remove();
                }
            });
        }, 4000);
    },

    copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                this.showToast(`<i class="fa-solid fa-check"></i> ${UIMessages.Clipboard.copied}`);
            })
            .catch(() => {
                this.showToast(
                    `<i class="fa-solid fa-xmark"></i> ${UIMessages.Clipboard.error}`,
                    'error'
                );
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

    animateValue(obj: HTMLElement, start: number | null, end: number, duration: number = 1500) {
        const currentVal = parseInt(obj.innerText.replace(/[^0-9.-]+/g, '')) || 0;
        const actualStart = start !== null ? start : currentVal;

        if (actualStart === end) {
            obj.innerHTML = end.toLocaleString();
            return;
        }

        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(easeProgress * (end - actualStart) + actualStart);
            obj.innerHTML = current.toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }
};
