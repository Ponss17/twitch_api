import { Session } from '../../types.js';
import { TmiService } from '../../services/tmiService.js';

export const BaseModule = {
    session: null as Session | null,
    initialized: false,
    cssLoaded: false,
    uiInitialized: false,
    isConnected: false,

    authHeaders(this: { session: Session | null }): Record<string, string> {
        const headers: Record<string, string> = {};
        if (this.session?.token) headers['Authorization'] = `Bearer ${this.session.token}`;
        return headers;
    },

    authQuery(this: { session: Session | null }): string {
        if (this.session?.apiKey) return `apiKey=${encodeURIComponent(this.session.apiKey)}`;
        if (this.session?.token) return `token=${encodeURIComponent(this.session.token)}`;
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
    }
};
