import { Auth } from './auth.js';
import { UI } from './ui.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
    Auth.setupLoginButton('login-btn');

    const heroCode = document.getElementById('hero-code-display');
    if (heroCode) UI.setupHeroAnimation(heroCode);

    UI.setupFooter(CONFIG);

    const sessionParams = Auth.parseUrlParams();
    if (sessionParams.token || sessionParams.apiKey) {
        window.location.href = `./dashboard?${window.location.search.substring(1)}`;
    }
});
