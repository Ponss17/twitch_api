import { FooterComponent } from './components/footer.js';
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('docs-search');
    const sections = document.querySelectorAll('.doc-section');
    const navGroup = document.querySelector('.sidebar-nav');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            let foundAny = false;

            sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                const title = section.querySelector('h2')?.textContent || '';
                const id = section.getAttribute('id');
                const navItem = document.querySelector(`.nav-item[href="#${id}"]`);

                if (text.includes(query)) {
                    section.style.display = 'block';
                    if (navItem) navItem.style.display = 'flex';

                    foundAny = true;
                } else {
                    section.style.display = 'none';
                    if (navItem) navItem.style.display = 'none';
                }
            });

            if (!query) {
                sections.forEach(s => s.style.display = 'block');
                document.querySelectorAll('.nav-item').forEach(n => n.style.display = 'flex');
            }
        });
    }
    FooterComponent.render('main-footer');
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

    window.switchTab = (btn, botName) => {
        const container = btn.closest('.code-tab-container');

        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        container.querySelector(`.tab-content[data-bot="${botName}"]`).classList.add('active');
    };

    window.copyCode = (btn) => {
        let codeButton = btn.parentElement.querySelector('code');
        let code = codeButton.textContent;

        try {
            const sessionData = localStorage.getItem('twitch_dashboard_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.apiKey) {
                    code = code.replace(/TU_API_KEY/g, session.apiKey);
                }
            }
        } catch (e) {
            console.warn('Could not retrieve session for API Key replacement');
        }

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
