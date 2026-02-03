import { Auth } from './auth.js';
import { LandingUI } from './ui-landing.js';
import { HeaderComponent } from './components/header.js';
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
        LandingUI.setupHeroAnimation(heroCode);
    HeaderComponent.render('main-header');
    FooterComponent.render('main-footer');
    setupFAQ();
    const header = document.getElementById('main-header');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        }
        else {
            header?.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    const sessionParams = Auth.parseUrlParams();
    if (sessionParams.token || sessionParams.apiKey) {
        const query = window.location.search;
        window.location.href = query ? `./dashboard${query}` : './dashboard';
    }
});
