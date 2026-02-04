import { FooterComponent } from './components/footer.js';
document.addEventListener('DOMContentLoaded', () => {
    FooterComponent.render('main-footer');
    const sections = document.querySelectorAll('.doc-section');
    const navItems = document.querySelectorAll('.nav-item');
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach((item) => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    sections.forEach((section) => observer.observe(section));
    const updateUrls = () => {
        const baseUrl = window.location.origin;
        document.querySelectorAll('.dynamic-url').forEach((el) => {
            const code = el;
            const path = code.dataset.path;
            if (!path)
                return;
            if (path.includes('{baseURL}')) {
                code.textContent = path.replace('{baseURL}', baseUrl);
            }
            else {
                code.textContent = `$(urlfetch ${baseUrl}${path})`;
            }
        });
    };
    updateUrls();
    window.copyCode = (btn) => {
        const code = btn.parentElement.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.classList.remove('success');
            }, 2000);
        });
    };
});
