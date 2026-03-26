import { Auth } from '../core/auth.js';
import { HeaderComponent } from '../shared/components/header.js';
import { FooterComponent } from '../shared/components/footer.js';
import { DisclaimerComponent } from '../shared/components/modals/disclaimerComponent.js';
import { injectSpeedInsights } from '@vercel/speed-insights';
import Lenis from 'lenis';

injectSpeedInsights({ debug: true });
function setupSmoothScroll() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false
    });

    function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const href = anchor.getAttribute('href');
            if (href && href !== '#') {
                lenis.scrollTo(href);
            }
        });
    });

    return lenis;
}

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
            } else {
                item.classList.add('active');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setupSmoothScroll();
    DisclaimerComponent.render('modal-container');

    const modal = document.getElementById('disclaimer-modal') as HTMLDialogElement;
    const loginBtn = document.getElementById('login-btn');
    const confirmBtn = document.getElementById('confirm-login-btn');
    const cancelBtn = document.getElementById('cancel-login-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const disclaimerText = document.querySelector('.disclaimer');

    const showModal = () => {
        if (modal) {
            if (typeof modal.showModal === 'function') {
                modal.showModal();
            } else {
                modal.style.display = 'block';
            }
        }
    };

    const closeModal = () => {
        if (modal) {
            if (typeof modal.close === 'function') {
                modal.close();
            } else {
                modal.style.display = 'none';
            }
        }
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal();
        });
    }

    if (disclaimerText) {
        disclaimerText.addEventListener('click', () => {
            showModal();
        });
        (disclaimerText as HTMLElement).style.cursor = 'pointer';
        (disclaimerText as HTMLElement).title = 'Ver detalles de privacidad';
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const icon = confirmBtn.querySelector('i');
            if (icon) {
                icon.className = 'fa-solid fa-spinner fa-spin';
            }
            confirmBtn.style.opacity = '0.8';
            confirmBtn.style.pointerEvents = 'none';
            Auth.relogin();
        });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            const rect = modal.getBoundingClientRect();
            const isInDialog =
                rect.top <= e.clientY &&
                e.clientY <= rect.top + rect.height &&
                rect.left <= e.clientX &&
                e.clientX <= rect.left + rect.width;
            if (!isInDialog) {
                closeModal();
            }
        });
    }

    HeaderComponent.render('main-header');
    FooterComponent.render('main-footer');
    setupFAQ();

    const header = document.getElementById('main-header');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
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
