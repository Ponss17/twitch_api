import { useEffect, useRef } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { NAV_ITEMS } from '@/features/dashboard/lib/dashboardTabs';
import {
    sidebarBackdrop,
    sidebarBrandHeader,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarShell,
    sidebarSupportLink
} from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { AppLogo } from '@/shared/ui/AppLogo';
import { IconMd } from '@/shared/ui/Icon';
import { Book } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SidebarProps {
    active: DashboardTab;
    onChange: (tab: DashboardTab) => void;
    mobileOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ active, onChange, mobileOpen, onClose }: SidebarProps) {
    const { t } = useTranslation();
    const asideRef = useRef<HTMLElement>(null);

    const supportLinkClass = `${sidebarSupportLink} underline decoration-[#52525b] underline-offset-[5px] hover:decoration-primary`;

    // Cerrado en móvil: no debe recibir foco (queda fuera de pantalla).
    useEffect(() => {
        const el = asideRef.current;
        if (!el) return;
        const applyInert = () => {
            const desktop = window.matchMedia('(min-width: 1024px)').matches;
            if (desktop || mobileOpen) {
                el.removeAttribute('inert');
                el.removeAttribute('aria-hidden');
            } else {
                el.setAttribute('inert', '');
                el.setAttribute('aria-hidden', 'true');
            }
        };
        applyInert();
        const mq = window.matchMedia('(min-width: 1024px)');
        mq.addEventListener('change', applyInert);
        return () => mq.removeEventListener('change', applyInert);
    }, [mobileOpen]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileOpen, onClose]);

    return (
        <>
            <aside
                ref={asideRef}
                id="dashboard-sidebar"
                className={sidebarShell(mobileOpen)}
            >
                <div className={sidebarBrandHeader}>
                    <AppLogo
                        alt="Logo"
                        className="h-12 w-12 rounded-lg object-contain"
                        draggable={false}
                    />
                    <span className="text-[1.1rem] font-bold text-[#fafafa]">
                        LosPerris<span className="text-[#a78bfa]">API</span>
                    </span>
                </div>

                <nav className={sidebarNavScroll} aria-label={t.sidebar.navigation}>
                    {NAV_ITEMS.map((item, index) => {
                        const prevCategory = index > 0 ? NAV_ITEMS[index - 1].category : '';
                        const showCategory = item.category && item.category !== prevCategory;
                        const isActive = active === item.id;
                        
                        // Extract translation keys safely
                        const catKey = item.category as keyof typeof t.sidebar.categories;
                        const itemKey = item.id as keyof typeof t.sidebar.items;

                        return (
                            <div key={item.id}>
                                {showCategory && (
                                    <p
                                        className={`mb-2 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-zinc-400 ${
                                            item.id === NAV_ITEMS[0].id ? 'mt-2' : 'mt-8'
                                        }`}
                                    >
                                        {item.category ? t.sidebar.categories[catKey] : ''}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(item.id);
                                        onClose();
                                    }}
                                    className={`${sidebarNavItem(isActive)} relative overflow-hidden`}
                                    aria-label={t.sidebar.items[itemKey]}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {isActive && (
                                        <LazyMotion features={domAnimation}>
                                            <m.div
                                                layoutId="sidebar-active"
                                                className="absolute inset-0 bg-primary/20"
                                                initial={false}
                                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                            />
                                        </LazyMotion>
                                    )}
                                    <div className="relative z-10 flex items-center gap-3">
                                        <IconMd
                                            icon={item.icon}
                                            className={isActive ? 'animate-nav-icon-bounce text-white' : ''}
                                        />
                                        <span>{t.sidebar.items[itemKey]}</span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}

                    <a
                        href={appPath('/docs')}
                        className={supportLinkClass}
                        onClick={saveDocsReturnPath}
                    >
                        <IconMd icon={Book} />
                        <span>{t.sidebar.docs}</span>
                    </a>
                    <a
                        href="https://discord.gg/PJbExZe7Tp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={supportLinkClass}
                    >
                        <DiscordIcon className="size-5 shrink-0" />
                        <span>{t.sidebar.discord}</span>
                    </a>
                </nav>
            </aside>

            {mobileOpen && (
                <button
                    type="button"
                    aria-label={t.header.closeMenu}
                    className={sidebarBackdrop}
                    onClick={onClose}
                />
            )}
        </>
    );
}
