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


    const COMMAND_PREFIXES = {
        nightbot: '!addcom {trigger} ',
        streamelements: '!command add {trigger} ',
        fossabot: '!addcom {trigger} '
    };

    window.switchFormat = (btn, format) => {
        const container = btn.closest('.code-tab-container');

        container.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        updateCodeBlock(container, format);
    };

    function updateCodeBlock(container, format) {
        const activeTab = container.querySelector('.tab-content.active');
        if (!activeTab) return;

        const botName = activeTab.dataset.bot;
        const codeElement = activeTab.querySelector('.dynamic-url');
        const originalPath = codeElement.dataset.path;
        const trigger = container.dataset.trigger;

        const baseUrl = window.location.origin;
        let finalCode = originalPath.includes('{baseURL}')
            ? originalPath.replace('{baseURL}', baseUrl)
            : `$(urlfetch ${baseUrl}${originalPath})`;

        if (format === 'chat' && trigger && COMMAND_PREFIXES[botName]) {
            const prefix = COMMAND_PREFIXES[botName].replace('{trigger}', trigger);
            finalCode = prefix + finalCode;
        }

        try {
            const sessionData = localStorage.getItem('twitch_dashboard_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.apiKey) {
                    finalCode = finalCode.replace(/TU_API_KEY/g, session.apiKey);
                }
            }
        } catch (e) {
            console.warn('Session error');
        }

        codeElement.textContent = finalCode;

        const copyBtn = activeTab.querySelector('.btn-copy-doc');
        if (copyBtn) {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyBtn.classList.remove('success');
        }
    }

    window.switchTab = (btn, botName) => {
        const container = btn.closest('.code-tab-container');

        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        container.querySelector(`.tab-content[data-bot="${botName}"]`).classList.add('active');

        const activeFormatBtn = container.querySelector('.format-btn.active');
        const currentFormat = activeFormatBtn ? (activeFormatBtn.textContent.trim() === 'Chat' ? 'chat' : 'dashboard') : 'dashboard';

        updateCodeBlock(container, currentFormat);
    };

    const updateUrls = () => {
        document.querySelectorAll('.code-tab-container').forEach(container => {
            updateCodeBlock(container, 'dashboard');
        });
    };
    setTimeout(() => {
        document.querySelectorAll('.code-tab-container').forEach(c => updateCodeBlock(c, 'chat'));
    }, 100);

    window.copyCode = (btn) => {
        let codeButton = btn.parentElement.querySelector('code');
        let code = codeButton.textContent;

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
