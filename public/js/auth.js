import { CONFIG } from './config.js';
export const Auth = {
    getSession() {
        try {
            const item = localStorage.getItem('twitch_api_session');
            return item ? JSON.parse(item) : null;
        }
        catch (_e) {
            return null;
        }
    },
    saveSession(sessionData) {
        localStorage.setItem('twitch_api_session', JSON.stringify(sessionData));
    },
    clearSession() {
        localStorage.removeItem('twitch_api_session');
    },
    logout() {
        this.clearSession();
        window.location.href = window.location.origin + window.location.pathname;
    },
    /**
     * Valida el token actual y devuelve los datos del usuario y el token actualizado
     * @param {string} credentialParam - Parámetros de credenciales (apiKey o token)
     * @returns {Promise<any>} Datos de validación o false
     */
    async validateCurrentToken(credentialParam) {
        try {
            if (!credentialParam)
                return null;
            const response = await fetch(`${CONFIG.API_URL}/system/validate?${credentialParam}`);
            if (!response.ok) {
                return false;
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const data = await response.json();
                return data.valid ? data : false;
            }
            return { valid: true };
        }
        catch (_e) {
            return false;
        }
    },
    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const savedSession = this.getSession();
        const session = {
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
    setupLoginButton(loginBtnId) {
        const loginBtn = document.getElementById(loginBtnId);
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.relogin();
            });
        }
    },
    relogin() {
        this.clearSession();
        let currentUrl = window.location.href.split('?')[0];
        currentUrl = currentUrl.replace('://www.', '://');
        const authPath = `${CONFIG.API_URL}/auth/twitch`;
        window.location.href = `${authPath}?redirect_origin=${encodeURIComponent(currentUrl)}`;
    }
};
