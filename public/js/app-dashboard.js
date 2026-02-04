import { Auth } from './core/auth.js';
import { UI } from './core/ui.js';
import { Dashboard } from './core/dashboard.js';
import { FooterComponent } from './shared/components/footer.js';
import { Messages } from './shared/i18n/messages.js';
import { AuthMessages } from './shared/i18n/authMessages.js';
document.addEventListener('DOMContentLoaded', async () => {
    FooterComponent.render('main-footer');
    UI.setupClipboard();
    const sessionParams = Auth.parseUrlParams();
    const { apiKey, token } = sessionParams;
    if (!apiKey && !token) {
        window.location.href = './';
        return;
    }
    let validationResult = null;
    try {
        const credentialParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;
        validationResult = await Auth.validateCurrentToken(credentialParam);
    }
    catch (e) {
        console.error('Error validating session:', e);
        UI.showToast(AuthMessages.validationError, 'error');
        Auth.clearSession();
        window.location.href = './';
        return;
    }
    if (validationResult) {
        try {
            let avatarUrl = null;
            let displayName = sessionParams.displayName || sessionParams.login;
            if (typeof validationResult === 'object' && validationResult !== null) {
                const data = validationResult;
                const user = data.user;
                if (!user) {
                    throw new Error('User data missing in validation');
                }
                if (data.token) {
                    sessionParams.token = data.token;
                }
                avatarUrl = user.profile_image_url;
                if (user.display_name) {
                    displayName = user.display_name;
                }
                sessionParams.displayName = displayName;
                sessionParams.profile_image_url = avatarUrl;
            }
            await Dashboard.init(sessionParams);
            Auth.saveSession(sessionParams);
            if (sessionParams.isNewLogin) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                Auth.saveSession(sessionParams);
            }
        }
        catch (initError) {
            console.error('CRITICAL: Error initializing dashboard:', initError);
            UI.showToast(Messages.Common.errorLoadingUI(initError.message), 'error');
        }
    }
    else {
        console.warn('Token invalid');
        UI.showToast(AuthMessages.sessionExpired, 'error');
        Auth.clearSession();
        setTimeout(() => {
            window.location.href = './';
        }, 2000);
    }
});
