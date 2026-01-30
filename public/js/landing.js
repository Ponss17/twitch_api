import { Auth } from './auth.js';
import { UI } from './ui.js';
import { FooterComponent } from './components/footer.js';
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = Math.floor(target).toString();
            clearInterval(timer);
        }
        else {
            element.textContent = Math.floor(start).toString();
        }
    }, 16);
}
function setupStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number [data-target], .stat-number[data-target]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseInt(element.dataset.target || '0');
                animateCounter(element, target);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(stat => observer.observe(stat));
}
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question?.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(otherItem => {
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
    setupStatsAnimation();
    setupFAQ();
    const sessionParams = Auth.parseUrlParams();
    if (sessionParams.token || sessionParams.apiKey) {
        const query = window.location.search;
        window.location.href = query ? `./dashboard${query}` : './dashboard';
    }
});
