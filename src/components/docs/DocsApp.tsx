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
import { X, Search, Menu, ArrowLeft } from 'lucide-react';
import { Home, Key, UserCog, Gauge, Rocket, Clock, Film, Megaphone, TrendingUp, Binoculars, Dices, Swords, List, AlertTriangle } from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON } from '@/lib/dashboardTabs';
import type { LucideIcon } from 'lucide-react';





const NAV_TOP: { id: string; icon: LucideIcon; label: string }[] = [
    { id: 'intro', icon: Home, label: 'Introducción' },
    { id: 'auth', icon: Key, label: 'Tu API Key' },
    { id: 'profile', icon: UserCog, label: 'Perfil y Seguridad' },
    { id: 'limits', icon: Gauge, label: 'Límites' },
    { id: 'quick-start', icon: Rocket, label: '¡Comienza Ya!' }
];

const NAV_GROUPS: { title: string; items: { id: string; icon: LucideIcon; label: string }[] }[] = [
    {
        title: 'Comandos',
        items: [
            { id: 'followage', icon: Clock, label: 'Followage' },
            { id: 'create-clip', icon: Film, label: 'Clips' },
            { id: 'shoutout', icon: Megaphone, label: 'Shoutout' }
        ]
    },
    {
        title: 'Herramientas',
        items: [
            { id: 'trends', icon: TrendingUp, label: 'Tendencias' },
            { id: 'stalker', icon: Binoculars, label: 'Stalker' },
            { id: 'roulette', icon: Dices, label: 'Ruleta' }
        ]
    },
    {
        title: 'Minijuegos',
        items: [
            { id: 'magic8', icon: MAGIC8_ICON, label: 'Bola 8' },
            { id: 'russian', icon: RUSSIAN_ICON, label: 'Ruleta Rusa' },
            { id: 'duel', icon: Swords, label: 'Duelo' }
        ]
    },
    {
        title: 'Extras',
        items: [
            { id: 'get-clips', icon: List, label: 'Listar Clips' },
            { id: 'errores', icon: AlertTriangle, label: 'Ayuda' }
        ]
    }
];

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
    const [returnPath, setReturnPath] = useState(() => appPath('/dashboard/'));

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
                {sidebarOpen ? <X /> : <Menu />}
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
                        <Search className={` ${docsSearchIcon}`} />
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
                                <item.icon className="w-4 h-4" /> {item.label}
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
                                            <item.icon className="w-4 h-4" /> {item.label}
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
                            <ArrowLeft className="w-4 h-4" /> Volver al Panel
                        </a>
                    </nav>
                </aside>

                <DocsContent />
            </div>
        </>
    );
}
