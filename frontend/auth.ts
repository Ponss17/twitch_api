import { CONFIG } from './config.js';

export const Auth = {
    getSession() {
        try {
            return JSON.parse(localStorage.getItem('twitch_api_session'));
        } catch (e) {
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

    async validateCurrentToken(credentialParam) {
        try {
            if (!credentialParam) return null;

            const response = await fetch(`${CONFIG.API_URL}/system/validate?${credentialParam}`);

            if (!response.ok) {
                return false;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                return data.valid ? data.user : false;
            }

            return true;
        } catch (e) {
            return false;
        }
    },

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const savedSession = this.getSession();

        return {
            token: params.get('token') || savedSession?.token,
            apiKey: params.get('apiKey') || savedSession?.apiKey,
            userId: params.get('userId') || savedSession?.userId,
            login: params.get('login') || savedSession?.login,
            displayName: params.get('displayName') || savedSession?.displayName,
            isNewLogin: !!params.get('token') || !!params.get('apiKey')
        };
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

        window.location.href = `auth/twitch?redirect_origin=${encodeURIComponent(currentUrl)}`;
    }
};
