import { useEffect, useState } from 'react';
import { appPath, docsReturnPath, staticPath } from '@/lib/paths';
import {
    docsContainer,
    docsGroupTitle,
    docsMobileToggle,
    docsNav,
    docsNavGroup,
    docsNavItem,
    docsNavSub,
    docsReturnHome,
    docsSearchIcon,
    docsSearchInput,
    docsSearchWrap,
    docsSidebar,
    docsSidebarHeader,
    docsSidebarLogo,
    docsSidebarTitle
} from '@/lib/docsTw';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { DocsContent } from '@/components/docs/DocsContent';


const NAV_TOP = [
    { id: 'intro', icon: 'fa-house', label: 'Introducción' },
    { id: 'auth', icon: 'fa-key', label: 'Tu API Key' },
    { id: 'profile', icon: 'fa-user-gear', label: 'Perfil y Seguridad' },
    { id: 'limits', icon: 'fa-gauge-high', label: 'Límites' },
    { id: 'quick-start', icon: 'fa-rocket', label: '¡Comienza Ya!' }
] as const;

const NAV_GROUPS = [
    {
        title: 'Comandos',
        items: [
            { id: 'followage', icon: 'fa-clock', label: 'Followage' },
            { id: 'create-clip', icon: 'fa-film', label: 'Clips' },
            { id: 'shoutout', icon: 'fa-bullhorn', label: 'Shoutout' }
        ]
    },
    {
        title: 'Herramientas',
        items: [
            { id: 'trends', icon: 'fa-chart-line', label: 'Tendencias' },
            { id: 'stalker', icon: 'fa-binoculars', label: 'Stalker' },
            { id: 'roulette', icon: 'fa-dice', label: 'Ruleta' }
        ]
    },
    {
        title: 'Minijuegos',
        items: [
            { id: 'magic8', icon: 'fa-8', label: 'Bola 8' },
            { id: 'russian', icon: 'fa-skull-crossbones', label: 'Ruleta Rusa' },
            { id: 'duel', icon: 'fa-khanda', label: 'Duelo' }
        ]
    },
    {
        title: 'Extras',
        items: [
            { id: 'get-clips', icon: 'fa-list', label: 'Listar Clips' },
            { id: 'errores', icon: 'fa-triangle-exclamation', label: 'Ayuda' }
        ]
    }
] as const;

export function DocsApp() {
    return (
        <ToastProvider>
            <DocsAppShell />
        </ToastProvider>
    );
}

function DocsAppShell() {
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeId, setActiveId] = useState('intro');
    const [returnPath, setReturnPath] = useState(() => appPath('/dashboard'));

    useEffect(() => {
        setReturnPath(docsReturnPath());
    }, []);

    useEffect(() => {
        const sections = document.querySelectorAll('[data-doc-section]');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        if (id) setActiveId(id);
                    }
                });
            },
            { root: null, rootMargin: '-15% 0px -65% 0px', threshold: 0 }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const query = search.toLowerCase().trim();
        const sections = document.querySelectorAll('[data-doc-section]');
        const subSections = document.querySelectorAll('[data-doc-nav-sub]');

        sections.forEach((section) => {
            const el = section as HTMLElement;
            const text = el.textContent?.toLowerCase() || '';
            const id = el.getAttribute('id');
            const navItem = document.querySelector(`[data-doc-nav="${id}"]`) as HTMLElement | null;

            if (!query || text.includes(query)) {
                el.style.display = 'block';
                if (navItem) navItem.style.display = 'flex';
            } else {
                el.style.display = 'none';
                if (navItem) navItem.style.display = 'none';
            }
        });

        subSections.forEach((sub) => {
            const visibleItems = sub.querySelectorAll('[data-doc-nav][style*="display: flex"]');
            const hasVisible = visibleItems.length > 0;
            (sub as HTMLElement).style.display = hasVisible || !query ? 'block' : 'none';
        });

        if (!query) {
            sections.forEach((s) => ((s as HTMLElement).style.display = 'block'));
            document.querySelectorAll('[data-doc-nav]').forEach((n) => ((n as HTMLElement).style.display = 'flex'));
            subSections.forEach((n) => ((n as HTMLElement).style.display = 'block'));
        }
    }, [search]);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <>
            <button
                type="button"
                className={docsMobileToggle}
                aria-label="Abrir menú de navegación"
                onClick={() => setSidebarOpen((v) => !v)}
            >
                <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'}`} />
            </button>

            <div className={docsContainer}>
                <aside className={docsSidebar(sidebarOpen)}>
                    <div className={docsSidebarHeader}>
                        <img
                            src={staticPath('/img/logo.svg')}
                            alt="Logo"
                            className={docsSidebarLogo}
                            draggable={false}
                        />
                        <h2 className={docsSidebarTitle}>Guía API</h2>
                    </div>

                    <div className={docsSearchWrap}>
                        <i className={`fa-solid fa-magnifying-glass ${docsSearchIcon}`} />
                        <input
                            type="text"
                            id="docs-search"
                            className={docsSearchInput}
                            placeholder="Buscar comandos..."
                            autoComplete="off"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <nav className={docsNav}>
                        {NAV_TOP.map((item) => (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                data-doc-nav={item.id}
                                className={docsNavItem(activeId === item.id)}
                                onClick={closeSidebar}
                            >
                                <i className={`fa-solid ${item.icon}`} /> {item.label}
                            </a>
                        ))}

                        <div className={docsNavGroup}>
                            {NAV_GROUPS.map((group) => (
                                <div key={group.title} data-doc-nav-sub className={docsNavSub}>
                                    <span className={docsGroupTitle}>{group.title}</span>
                                    {group.items.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            data-doc-nav={item.id}
                                            className={docsNavItem(activeId === item.id)}
                                            onClick={closeSidebar}
                                        >
                                            <i className={`fa-solid ${item.icon}`} /> {item.label}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <a
                            href={returnPath}
                            data-doc-nav="home"
                            className={docsReturnHome}
                            onClick={closeSidebar}
                        >
                            <i className="fa-solid fa-arrow-left" /> Volver al Panel
                        </a>
                    </nav>
                </aside>

                <DocsContent />
            </div>
        </>
    );
}
