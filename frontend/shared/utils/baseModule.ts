import { Session } from '../../types.js';
import { TmiService } from '../../services/tmiService.js';
import { Messages } from '../messages/messages.js';

export const BaseModule = {
    session: null as Session | null,
    initialized: false,
    cssLoaded: false,
    uiInitialized: false,
    isConnected: false,

    authHeaders(this: { session: Session | null }): Record<string, string> {
        const headers: Record<string, string> = {};
        if (this.session?.token) {
            headers['Authorization'] = `Bearer ${this.session.token}`;
        }
        if (this.session?.apiKey) {
            headers['x-api-key'] = this.session.apiKey;
        }
        return headers;
    },

    authQuery(this: { session: Session | null }): string {
        return '';
    },

    initBase(session: Session, cssPath: string): void {
        this.session = session;

        if (!this.cssLoaded) {
            import('./loader.js').then(({ Loader }) => {
                Loader.loadCSS(cssPath);
            });
            this.cssLoaded = true;
        }

        this.initialized = true;
    },

    connectTmiBase(onConnected: () => void, onError?: () => void): void {
        if (this.isConnected) return;
        if (!this.session) return;

        const auth = this.session.token
            ? {
                  username: this.session.login,
                  token: this.session.token
              }
            : undefined;

        TmiService.connect(this.session.login, auth)
            .then(() => {
                this.isConnected = true;
                onConnected();
            })
            .catch((err: unknown) => {
                console.error('[BaseModule] TMI Error:', err);
                if (onError) onError();
            });
    },

    disconnectTmi(listenerKey: string): void {
        TmiService.removeListener(listenerKey);
        TmiService.disconnect();
        this.isConnected = false;
    },

    showResponseIn(containerId: string, text: string, type: 'success' | 'error'): void {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.className = `response-card ${type} active`;
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
        const span = document.createElement('span');
        span.textContent = text;
        el.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        el.appendChild(span);
    },

    setLoading(buttonId: string, responseId: string, loadingMsg: string): void {
        const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
        const resp = document.getElementById(responseId);
        if (btn) btn.disabled = true;
        if (resp) {
            resp.className = 'response-card active';
            resp.innerHTML = Messages.Common.spinner(loadingMsg);
        }
    },

    async formatApiError(res: Response): Promise<string> {
        const { formatApiError } = await import('./api-errors.js');
        return formatApiError(res);
    }
};
