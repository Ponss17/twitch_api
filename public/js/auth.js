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

    async validateCurrentToken(paramStr) {
        try {
            const res = await fetch(`api/validate?${paramStr}`);
            return res.ok;
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
            isNewLogin: !!params.get('token')
        };
    },

    setupLoginButton(loginBtnId) {
        const loginBtn = document.getElementById(loginBtnId);
        if (loginBtn) {
            let currentUrl = window.location.href.split('?')[0];
            currentUrl = currentUrl.replace('://www.', '://');
            loginBtn.href = `auth/twitch?redirect_origin=${encodeURIComponent(currentUrl)}`;
        }
    }
};
