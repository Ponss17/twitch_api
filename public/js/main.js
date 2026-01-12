import { Auth } from './auth.js';
import { UI } from './ui.js';
import { Dashboard } from './dashboard.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    Auth.setupLoginButton('login-btn');

    const heroCode = document.getElementById('hero-code-display');
    if (heroCode) UI.setupHeroAnimation(heroCode);

    UI.setupFooter(CONFIG);
    UI.setupClipboard(document.querySelectorAll('.copy-btn'));

    const sessionParams = Auth.parseUrlParams();
    const { apiKey, token, userId } = sessionParams;

    if ((apiKey || token) && userId) {
        const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

        try {
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
            } else {
                UI.showToast("Tu sesión ha expirado", "error");
                Auth.clearSession();
                setTimeout(() => {
                    window.location.href = window.location.origin + window.location.pathname;
                }, 2000);
            }
        } catch (e) {
            console.error('Error validating session:', e);
            UI.showToast("Error al validar sesión", "error");
            Auth.clearSession();
        }
    }
});
