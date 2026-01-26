import { Auth } from './auth.js';
import { UI } from './ui.js';
import { Dashboard } from './dashboard.js';
import { CONFIG } from './config.js';
import { FooterComponent } from './components/footer.js';
import { Messages } from './utils/messages.js';
import { errorHandler } from './utils/errorHandler.js';

document.addEventListener('DOMContentLoaded', async () => {
    FooterComponent.render('main-footer');
    UI.setupClipboard();

    const sessionParams = Auth.parseUrlParams();
    const { apiKey, token, userId } = sessionParams;

    if (!apiKey && !token) {
        window.location.href = './';
        return;
    }

    let validationResult = null;

    try {
        const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        validationResult = await Auth.validateCurrentToken(credentialParam);
    } catch (e) {
        console.error('Error validating session:', e);
        UI.showToast(Messages.Auth.validationError, "error");
        Auth.clearSession();
        window.location.href = './';
        return;
    }

    if (validationResult) {
        try {
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
        } catch (initError) {
            console.error('CRITICAL: Error initializing dashboard:', initError);
            UI.showToast(Messages.Common.errorLoadingUI(initError.message), 'error');
        }
    } else {
        console.warn("Token invalid");
        UI.showToast(Messages.Auth.sessionExpired, "error");
        Auth.clearSession();
        setTimeout(() => {
            window.location.href = './';
        }, 2000);
    }
}
);
