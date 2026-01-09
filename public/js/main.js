import { Auth } from './auth.js';
import { UI } from './ui.js';
import { Dashboard } from './dashboard.js';
import { Tracker } from './tracker.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {

    Auth.setupLoginButton('login-btn');
    UI.setupHeroAnimation(document.getElementById('hero-code-display'));
    UI.setupFooter(CONFIG);

    UI.setupClipboard(document.querySelectorAll('.copy-btn'));

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => Auth.logout());
    }

    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const refreshClipsBtn = document.getElementById('refresh-clips-btn');

    UI.setupTabs(tabBtns, tabContents, () => Dashboard.loadClips());

    if (refreshClipsBtn) {
        refreshClipsBtn.addEventListener('click', () => Dashboard.loadClips());
    }

    const sessionParams = Auth.parseUrlParams();
    const { apiKey, token, userId } = sessionParams;

    if ((apiKey || token) && userId) {
        const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

        const validationResult = await Auth.validateCurrentToken(credentialParam);

        if (validationResult) {
            let avatarUrl = null;
            let displayName = sessionParams.displayName || sessionParams.login;

            if (typeof validationResult === 'object') {
                avatarUrl = validationResult.profile_image_url;
                if (validationResult.display_name) displayName = validationResult.display_name;
                sessionParams.displayName = displayName;
            }

            Dashboard.init(sessionParams);
            Tracker.init(sessionParams.login, displayName, avatarUrl);
        } else {
            UI.showToast("⚠ Tu sesión ha expirado. Redirigiendo...", "error");
            Auth.clearSession();
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname;
            }, 2000);
        }
    }
});
