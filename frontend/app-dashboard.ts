import { Auth } from './core/auth.js';
import { UI } from './core/ui-core.js';
import { Dashboard } from './core/dashboard.js';
import { FooterComponent } from './shared/components/footer.js';
import { DashboardModalsComponent } from './shared/components/modals/dashboardModalsComponent.js';
import { ToastComponent } from './shared/components/toast.js';
import { Messages } from './shared/messages/messages.js';
import { AuthMessages } from './shared/messages/authMessages.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights({
    endpoint: 'https://twitch-api-smoky.vercel.app/_vercel/speed-insights/vitals',
    scriptSrc: 'https://twitch-api-smoky.vercel.app/_vercel/speed-insights/script.js',
    route: window.location.pathname
});

import { TwitchUser, Session, ApiResponse } from './types.js';

document.addEventListener('DOMContentLoaded', async () => {
    FooterComponent.render('main-footer');
    DashboardModalsComponent.render('dashboard-modals-container');
    ToastComponent.init();
    UI.setupClipboard();
    UI.setupMobileMenu();
    Auth.initAuthSync();

    import('./core/dashboardStore.js').then(({ dashboardStore }) => {
        let wasOffline = !dashboardStore.getState().isOnline;
        dashboardStore.on('isOnline', (state) => {
            if (!state.isOnline) {
                UI.showToast('Sin conexión a internet. Modo offline activado.', 'warning');
                wasOffline = true;
            } else if (wasOffline) {
                UI.showToast('Conexión restaurada', 'success');
                wasOffline = false;
            }
        });
    });

    const sessionParams: Session = Auth.parseUrlParams();
    const { apiKey, token } = sessionParams;

    if (!apiKey && !token) {
        window.location.href = './';
        return;
    }

    let validationResult = null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validationResult = (await Auth.validateCurrentToken({ apiKey, token })) as any;
    } catch (e) {
        console.error('Error executing validation:', e);
        validationResult = { valid: true, error: true };
    }

    if (validationResult && validationResult.valid) {
        if (validationResult.error) {
            UI.showToast('Conexión inestable con el servidor', 'warning');
        }
        try {
            let avatarUrl = null;
            let displayName = sessionParams.displayName || sessionParams.login;

            if (typeof validationResult === 'object' && validationResult !== null) {
                const data = validationResult as ApiResponse<TwitchUser>;
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

            if (
                validationResult &&
                typeof validationResult === 'object' &&
                validationResult.apiKey
            ) {
                sessionParams.apiKey = validationResult.apiKey;
            }

            await Dashboard.init(sessionParams);
            Auth.saveSession(sessionParams);

            if (sessionParams.isNewLogin) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                Auth.saveSession(sessionParams);
            }
        } catch (initError) {
            console.error('CRITICAL: Error initializing dashboard:', initError);
            UI.showToast(Messages.Common.errorLoadingUI((initError as Error).message), 'error');
        }
    } else {
        console.warn('Token invalid');
        UI.showToast(AuthMessages.sessionExpired, 'error');
        Auth.clearSession();
        setTimeout(() => {
            window.location.href = './';
        }, 2000);
    }
});
