import { Auth } from './auth.js';
import { UI } from './ui.js';
import { Dashboard } from './dashboard.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    UI.setupClipboard(document.querySelectorAll('.copy-btn'));

    const sessionParams = Auth.parseUrlParams();
    const { apiKey, token, userId } = sessionParams;

    if (!apiKey && !token) {
        window.location.href = './';
        return;
    }

    try {
        const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        const validationResult = await Auth.validateCurrentToken(credentialParam);

        if (validationResult) {
            let avatarUrl = null;
            let displayName = sessionParams.displayName || sessionParams.login;

            if (typeof validationResult === 'object') {
                avatarUrl = validationResult.profile_image_url;
                if (validationResult.display_name) {
                    displayName = validationResult.display_name;
                }
                sessionParams.displayName = displayName;
                sessionParams.profile_image_url = avatarUrl;
            }

            Dashboard.init(sessionParams);

            if (sessionParams.isNewLogin) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                Auth.saveSession(sessionParams);
            }

        } else {
            console.warn("Token invalid");
            UI.showToast("Tu sesión ha expirado", "error");
            Auth.clearSession();
            setTimeout(() => {
                window.location.href = './';
            }, 2000);
        }
    } catch (e) {
        console.error('Error validating session:', e);
        UI.showToast("Error al validar sesión", "error");
        Auth.clearSession();
        window.location.href = './';
    }
});
