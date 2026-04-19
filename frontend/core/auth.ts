import { CONFIG } from '../config.js';
import { Session, ApiResponse } from '../types.js';

export const Auth = {
    authChannel: null as BroadcastChannel | null,

    initAuthSync(): void {
        if (!this.authChannel) {
            this.authChannel = new BroadcastChannel('auth_sync_channel');
            this.authChannel.onmessage = (event) => {
                if (event.data.type === 'LOGOUT') {
                    console.log('[AuthSync] Logout received from another tab.');
                    this.clearSession();
                    window.location.href = window.location.origin + window.location.pathname;
                }
            };
        }
    },
    getSession(): Session | null {
        try {
            const item = localStorage.getItem('twitch_api_session');
            return item ? JSON.parse(item) : null;
        } catch (_e) {
            return null;
        }
    },

    saveSession(sessionData: Session): void {
        localStorage.setItem('twitch_api_session', JSON.stringify(sessionData));
    },

    clearSession(): void {
        localStorage.removeItem('twitch_api_session');
    },

    logout(): void {
        this.clearSession();
        if (this.authChannel) {
            this.authChannel.postMessage({ type: 'LOGOUT' });
        } else {
            const tempChannel = new BroadcastChannel('auth_sync_channel');
            tempChannel.postMessage({ type: 'LOGOUT' });
            tempChannel.close();
        }
        window.location.href = window.location.origin + window.location.pathname;
    },

    async validateCurrentToken(session: {
        token?: string | null;
        apiKey?: string | null;
    }): Promise<
        | ApiResponse
        | false
        | { valid: boolean; error?: boolean; reason?: string; status?: number }
        | null
    > {
        try {
            if (!session || (!session.apiKey && !session.token))
                return { valid: false, reason: 'no_credentials' };

            const headers: Record<string, string> = {};
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
            if (session.apiKey) headers['x-api-key'] = session.apiKey;

            const response = await fetch(`${CONFIG.API_URL}/system/validate`, { headers });

            if (!response.ok) {
                if (response.status === 401) {
                    return { valid: false, status: 401, reason: 'unauthorized' };
                }
                console.warn(`Server error ${response.status} during validation.`);
                return {
                    valid: false,
                    error: true,
                    status: response.status,
                    reason: 'server_error'
                };
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const data: ApiResponse = await response.json();
                return data.valid ? data : { valid: false, reason: 'invalid_response' };
            }

            return { valid: true } as ApiResponse;
        } catch (e) {
            console.error('Network error validating token:', e);
            return { valid: true, error: true, reason: 'network_error' };
        }
    },

    async syncApiKey(session: Session): Promise<Session> {
        if (!session.userId) return session;

        try {
            const validation = await this.validateCurrentToken({
                apiKey: session.apiKey,
                token: session.token
            });

            if (validation && typeof validation === 'object' && 'apiKey' in validation) {
                const serverApiKey = validation.apiKey;

                if (serverApiKey && serverApiKey !== session.apiKey) {
                    session.apiKey = serverApiKey;
                    this.saveSession(session);

                    import('./ui.js').then(({ UI }) => {
                        UI.showToast('Tu API Key ha sido actualizada', 'info');
                    });
                }
            }

            return session;
        } catch (_e) {
            return session;
        }
    },

    async updateTimezone(timezone: string, session: Session): Promise<boolean> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
            if (session.apiKey) headers['x-api-key'] = session.apiKey;

            const response = await fetch(`${CONFIG.API_URL}/dashboard/timezone`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ timezone })
            });

            return response.ok;
        } catch (e) {
            console.error('Error updating timezone:', e);
            return false;
        }
    },

    parseUrlParams(): Session {
        const params = new URLSearchParams(window.location.search);
        const savedSession = this.getSession();

        const session: Session = {
            login: params.get('login') || savedSession?.login || '',
            displayName: params.get('displayName') || savedSession?.displayName || '',
            profile_image_url: savedSession?.profile_image_url || '',
            token: params.get('token') || savedSession?.token,
            apiKey: params.get('apiKey') || savedSession?.apiKey,
            userId: params.get('userId') || savedSession?.userId,
            isNewLogin: !!params.get('token') || !!params.get('apiKey')
        };

        return session;
    },

    setupLoginButton(loginBtnId: string): void {
        const loginBtn = document.getElementById(loginBtnId);
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.relogin();
            });
        }
    },

    relogin(): void {
        this.clearSession();
        let currentUrl = window.location.origin + window.location.pathname;
        currentUrl = currentUrl.replace('://www.', '://');

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const authPath = `${CONFIG.API_URL}/auth/twitch`;
        let loginUrl = `${authPath}?redirect_origin=${encodeURIComponent(currentUrl)}`;
        if (tz) loginUrl += `&tz=${encodeURIComponent(tz)}`;
        window.location.href = loginUrl;
    }
};
