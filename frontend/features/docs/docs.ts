import { FooterComponent } from '../../shared/components/footer.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights({
    debug: false,
    scriptSrc: 'https://va.vercel-scripts.com/v1/speed-insights/script.js'
});

document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('.nav-item');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                sidebar.classList.remove('active');
                if (mobileToggle) {
                    const icon = mobileToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-xmark');
                    }
                }
            });
        });
    }

    const searchInput = document.getElementById('docs-search') as HTMLInputElement;
    const sections = document.querySelectorAll('.doc-section');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const query = target.value.toLowerCase();

            sections.forEach((section) => {
                const text = section.textContent?.toLowerCase() || '';
                const id = section.getAttribute('id');
                const navItem = document.querySelector(`.nav-item[href="#${id}"]`) as HTMLElement;

                if (text.includes(query)) {
                    (section as HTMLElement).style.display = 'block';
                    if (navItem) navItem.style.display = 'flex';
                } else {
                    (section as HTMLElement).style.display = 'none';
                    if (navItem) navItem.style.display = 'none';
                }
            });

            const subSections = document.querySelectorAll('.nav-subsection');
            subSections.forEach((sub) => {
                const visibleItems = sub.querySelectorAll('.nav-item[style*="display: flex"]');
                const hasVisible = visibleItems.length > 0;
                (sub as HTMLElement).style.display = hasVisible ? 'block' : 'none';
            });

            if (!query) {
                sections.forEach((s) => ((s as HTMLElement).style.display = 'block'));
                document
                    .querySelectorAll('.nav-item')
                    .forEach((n) => ((n as HTMLElement).style.display = 'flex'));
                document
                    .querySelectorAll('.nav-subsection')
                    .forEach((n) => ((n as HTMLElement).style.display = 'block'));
            }
        });
    }

    FooterComponent.render('main-footer');

    const observerOptions = {
        root: null as Element | null,
        rootMargin: '-15% 0px -65% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                if (!id) return;

                navItems.forEach((item) => {
                    const el = item as HTMLElement;
                    el.classList.remove('active');
                    if (el.getAttribute('href') === `#${id}`) {
                        el.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    const COMMAND_PREFIXES: Record<string, string> = {
        nightbot: '!addcom {trigger} ',
        streamelements: '!command add {trigger} ',
        fossabot: '!addcom {trigger} '
    };

    function updateCodeBlock(container: HTMLElement, format: string) {
        const activeTab = container.querySelector('.tab-content.active') as HTMLElement;
        if (!activeTab) return;

        const botName = activeTab.dataset.bot || '';
        const codeElement = activeTab.querySelector('.dynamic-url') as HTMLElement;
        const originalPath = codeElement.dataset.path || '';
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
            console.warn('Session error', e);
        }

        codeElement.textContent = finalCode;

        const copyBtn = activeTab.querySelector('.btn-copy-doc');
        if (copyBtn) {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyBtn.classList.remove('success');
        }
    }

    function switchFormat(btn: HTMLElement, format: string) {
        const container = btn.closest('.code-tab-container') as HTMLElement;
        container.querySelectorAll('.format-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        updateCodeBlock(container, format);
    }

    function switchTab(btn: HTMLElement, botName: string) {
        const container = btn.closest('.code-tab-container') as HTMLElement;
        container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        container.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        const targetTab = container.querySelector(`.tab-content[data-bot="${botName}"]`);
        if (targetTab) targetTab.classList.add('active');

        const activeFormatBtn = container.querySelector('.format-btn.active');
        const currentFormat = activeFormatBtn
            ? activeFormatBtn.textContent?.trim() === 'Chat'
                ? 'chat'
                : 'dashboard'
            : 'dashboard';

        updateCodeBlock(container, currentFormat);
    }

    function copyCode(btn: HTMLElement) {
        const codeElement = btn.parentElement?.querySelector('code');
        const code = codeElement?.textContent || '';

        navigator.clipboard.writeText(code).then(() => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.classList.remove('success');
            }, 2000);
        });
    }

    document.querySelectorAll<HTMLElement>('.tab-btn').forEach((btn) => {
        const label = btn.textContent?.trim().toLowerCase() || '';
        const botMap: Record<string, string> = {
            nightbot: 'nightbot',
            streamelements: 'streamelements',
            fossabot: 'fossabot'
        };
        const resolved = botMap[label];
        if (resolved) {
            btn.addEventListener('click', () => switchTab(btn, resolved));
        }
    });

    document.querySelectorAll<HTMLElement>('.format-btn').forEach((btn) => {
        const label = btn.textContent?.trim().toLowerCase() || '';
        const format = label === 'chat' ? 'chat' : 'dashboard';
        btn.addEventListener('click', () => switchFormat(btn, format));
    });

    document.querySelectorAll<HTMLElement>('.btn-copy-doc').forEach((btn) => {
        btn.addEventListener('click', () => copyCode(btn));
    });

    setTimeout(() => {
        document
            .querySelectorAll('.code-tab-container')
            .forEach((c) => updateCodeBlock(c as HTMLElement, 'chat'));
    }, 100);
});
