import { Auth } from './auth.js';
import { UI } from './ui.js';
import { FooterComponent } from './components/footer.js';
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        question?.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach((otherItem) => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            if (isActive) {
                item.classList.remove('active');
            }
            else {
                item.classList.add('active');
            }
        });
    });
}
document.addEventListener('DOMContentLoaded', async () => {
    Auth.setupLoginButton('login-btn');
    const heroCode = document.getElementById('hero-code-display');
    if (heroCode)
        UI.setupHeroAnimation(heroCode);
    FooterComponent.render('main-footer');
    setupFAQ();
    const sessionParams = Auth.parseUrlParams();
    if (sessionParams.token || sessionParams.apiKey) {
        const query = window.location.search;
        window.location.href = query ? `./dashboard${query}` : './dashboard';
    }
});
