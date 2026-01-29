import { CONFIG } from './config.js';
import { Session, ApiResponse } from './types.js';

export const Auth = {
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
        window.location.href = window.location.origin + window.location.pathname;
    },

    /**
     * Valida el token actual y devuelve los datos del usuario y el token actualizado
     * @param {string} credentialParam - Parámetros de credenciales (apiKey o token)
     * @returns {Promise<any>} Datos de validación o false
     */
    async validateCurrentToken(credentialParam: string): Promise<ApiResponse | false | null> {
        try {
            if (!credentialParam) return null;

            const response = await fetch(`${CONFIG.API_URL}/system/validate?${credentialParam}`);

            if (!response.ok) {
                return false;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const data: ApiResponse = await response.json();
                return data.valid ? data : false;
            }

            return { valid: true } as ApiResponse;
        } catch (_e) {
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
        let currentUrl = window.location.href.split('?')[0];
        currentUrl = currentUrl.replace('://www.', '://');

        const authPath = `${CONFIG.API_URL}/auth/twitch`;
        window.location.href = `${authPath}?redirect_origin=${encodeURIComponent(currentUrl)}`;
    }
};
